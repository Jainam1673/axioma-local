"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MetricCard } from "@/components/metric-card";
import { getDashboardSummary } from "@/lib/api";
import { clearTokens, getAccessToken } from "@/lib/auth";

interface DashboardState {
  loading: boolean;
  error: string | null;
  summary: Awaited<ReturnType<typeof getDashboardSummary>> | null;
}

export default function HomePage(): React.JSX.Element {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    summary: null,
  });

  useEffect(() => {
    async function load(): Promise<void> {
      const token = getAccessToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const summary = await getDashboardSummary(token);
        setState({ loading: false, error: null, summary });
      } catch {
        clearTokens();
        setState({
          loading: false,
          error: "Session expired. Please sign in again.",
          summary: null,
        });
      }
    }

    void load();
  }, [router]);

  if (state.loading) {
    return <main className="p-8 text-sm text-slate-600">Loading dashboard...</main>;
  }

  if (state.error || !state.summary) {
    return (
      <main className="p-8 text-sm text-red-600">
        {state.error ?? "Unable to load dashboard."}
      </main>
    );
  }

  const { summary } = state;

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Decision Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Deterministic clarity on profit, buffer discipline, and safe partner withdrawals.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Real Net Profit" value={summary.realNetProfit} />
        <MetricCard label="Safe Withdrawal Ceiling" value={summary.safeWithdrawalCeiling} />
        <MetricCard label="Required Buffer" value={summary.requiredBuffer} />
        <MetricCard label="Distributable Pool" value={summary.distributablePool} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Partner Distribution</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {Object.entries(summary.partnerMaxWithdrawal).map(([partnerId, amount]) => (
              <li key={partnerId} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="font-medium">{partnerId}</span>
                <span>₹{amount}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Buffer Status</h2>
          <dl className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <dt className="font-medium">Runway Months</dt>
              <dd>{summary.runwayMonths}</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <dt className="font-medium">Operating Profit</dt>
              <dd>₹{summary.operatingProfit}</dd>
            </div>
          </dl>
        </article>
      </section>
    </main>
  );
}
