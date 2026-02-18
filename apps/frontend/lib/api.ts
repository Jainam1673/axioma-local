export interface DashboardSummary {
  realizedRevenue: string;
  operatingProfit: string;
  realNetProfit: string;
  monthlyBurn: string;
  requiredBuffer: string;
  distributablePool: string;
  remainingPool: string;
  safeWithdrawalCeiling: string;
  runwayMonths: string;
  partnerBreakdown: Array<{
    partnerId: string;
    allowedTotal: string;
    withdrawnSoFar: string;
    remainingLimit: string;
  }>;
  riskStatus: {
    profitHealth: "healthy" | "caution" | "critical";
    withdrawalHealth: "safe" | "warning" | "alert";
    runwayHealth: "stable" | "monitor" | "critical";
    overdrawn: boolean;
  };
  partnerMaxWithdrawal: Record<string, string>;
  clientMargin: Record<
    string,
    { realizedRevenue: string; estimatedCost: string; marginAmount: string; marginPercent: string }
  >;
}

export async function getDashboardSummary(accessToken: string): Promise<DashboardSummary> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

  const response = await fetch(`${baseUrl}/dashboard/summary`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load dashboard summary: ${response.status}`);
  }

  return (await response.json()) as DashboardSummary;
}
