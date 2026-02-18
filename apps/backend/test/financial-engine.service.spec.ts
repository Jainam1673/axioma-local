import { describe, expect, it } from "vitest";
import { ClientProfitabilityService } from "../src/modules/engine/client-profitability.service.js";
import { FinancialEngineService } from "../src/modules/engine/financial-engine.service.js";
import { RiskEvaluatorService } from "../src/modules/engine/risk-evaluator.service.js";
import { WithdrawalSimulatorService } from "../src/modules/engine/withdrawal-simulator.service.js";

describe("FinancialEngineService", () => {
  const service = new FinancialEngineService(
    new ClientProfitabilityService(),
    new RiskEvaluatorService(),
  );
  const withdrawalSimulatorService = new WithdrawalSimulatorService();

  it("calculates deterministic operating and buffer outputs", () => {
    const result = service.calculate({
      realizedRevenue: 500000,
      paidExpenses: 150000,
      salaries: 100000,
      fixedMonthlyExpense: 50000,
      bufferMonths: 1,
      recurringExpenses: 50000,
      avgFixedCosts: 50000,
      partners: [
        { partnerId: "p1", shareRatio: 0.5, alreadyWithdrawn: 10000 },
        { partnerId: "p2", shareRatio: 0.5, alreadyWithdrawn: 0 },
      ],
    });

    expect(result.realizedRevenue).toBe("500000");
    expect(result.operatingProfit).toBe("250000");
    expect(result.monthlyBurn).toBe("200000");
    expect(result.requiredBuffer).toBe("200000");
    expect(result.distributablePool).toBe("50000");
    expect(result.remainingPool).toBe("40000");
    expect(result.safeWithdrawalCeiling).toBe("40000");
    expect(result.riskStatus.withdrawalHealth).toBe("safe");
    expect(result.riskStatus.profitHealth).toBe("healthy");
    expect(result.partnerMaxWithdrawal.p1).toBe("15000");
    expect(result.partnerMaxWithdrawal.p2).toBe("25000");
    expect(result.partnerBreakdown).toHaveLength(2);
  });

  it("caps safe and partner withdrawals at zero when remaining pool is negative", () => {
    const result = service.calculate({
      realizedRevenue: 100000,
      paidExpenses: 80000,
      salaries: 50000,
      fixedMonthlyExpense: 100000,
      bufferMonths: 2,
      totalWithdrawn: 5000,
      partners: [{ partnerId: "p1", shareRatio: 1, alreadyWithdrawn: 5000 }],
    });

    expect(result.distributablePool).toBe("-330000");
    expect(result.remainingPool).toBe("-335000");
    expect(result.safeWithdrawalCeiling).toBe("0");
    expect(result.partnerMaxWithdrawal.p1).toBe("0");
    expect(result.riskStatus.profitHealth).toBe("critical");
    expect(result.riskStatus.overdrawn).toBe(true);
  });

  it("calculates client margins and runway months", () => {
    const result = service.calculate({
      realizedRevenue: 300000,
      paidExpenses: 100000,
      salaries: 50000,
      fixedMonthlyExpense: 75000,
      bufferMonths: 1,
      recurringExpenses: 25000,
      avgFixedCosts: 25000,
      cashBalance: 225000,
      partners: [{ partnerId: "p1", shareRatio: 1, alreadyWithdrawn: 0 }],
      clients: [
        {
          clientId: "c1",
          realizedRevenue: 100000,
          directExpenses: 30000,
          allocatedSalary: 5000,
          proportionalOverhead: 5000,
        },
        {
          clientId: "c2",
          realizedRevenue: 200000,
          paidExpense: 150000,
        },
      ],
    });

    expect(result.runwayMonths).toBe("2.25");
    expect(result.clientMargin.c1).toBeDefined();
    expect(result.clientMargin.c2).toBeDefined();
    expect(result.clientMargin.c1!.marginAmount).toBe("60000");
    expect(result.clientMargin.c1!.marginPercent).toBe("60");
    expect(result.clientMargin.c2!.marginPercent).toBe("25");
  });

  it("handles zero revenue scenario deterministically", () => {
    const result = service.calculate({
      realizedRevenue: 0,
      paidExpenses: 10000,
      salaries: 15000,
      fixedMonthlyExpense: 5000,
      bufferMonths: 2,
      partners: [{ partnerId: "p1", shareRatio: 1, alreadyWithdrawn: 0 }],
      clients: [{ clientId: "c1", realizedRevenue: 0, paidExpense: 1000 }],
    });

    expect(result.operatingProfit).toBe("-25000");
    expect(result.clientMargin.c1!.marginPercent).toBe("0");
    expect(result.riskStatus.profitHealth).toBe("critical");
  });

  it("supports negative revenue edge case", () => {
    const result = service.calculate({
      realizedRevenue: -1000,
      paidExpenses: 0,
      salaries: 0,
      fixedMonthlyExpense: 100,
      bufferMonths: 1,
      partners: [{ partnerId: "p1", shareRatio: 1, alreadyWithdrawn: 0 }],
    });

    expect(result.realizedRevenue).toBe("-1000");
    expect(result.operatingProfit).toBe("-1000");
    expect(result.riskStatus.profitHealth).toBe("critical");
  });

  it("handles extreme buffer case", () => {
    const result = service.calculate({
      realizedRevenue: 250000,
      paidExpenses: 50000,
      salaries: 50000,
      fixedMonthlyExpense: 50000,
      bufferMonths: 12,
      partners: [{ partnerId: "p1", shareRatio: 1, alreadyWithdrawn: 0 }],
    });

    expect(result.requiredBuffer).toBe("1200000");
    expect(result.safeWithdrawalCeiling).toBe("0");
    expect(result.riskStatus.profitHealth).toBe("caution");
  });

  it("simulates withdrawal and blocks over-withdrawal", () => {
    const result = withdrawalSimulatorService.simulate({
      partnerId: "p1",
      requestedAmount: 30000,
      currentCashBalance: 100000,
      monthlyBurn: 20000,
      remainingPool: 20000,
    });

    expect(result.blocked).toBe(true);
    expect(result.decision).toBe("block");
    expect(result.newRemainingPool).toBe("-10000");
    expect(result.riskLevel).toBe("safe");
  });
});
