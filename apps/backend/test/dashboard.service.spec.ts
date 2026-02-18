import { describe, expect, it, vi } from "vitest";
import { DashboardService } from "../src/modules/dashboard/dashboard.service.js";

describe("DashboardService", () => {
  it("returns cached summary when available", async () => {
    const cached = {
      realizedRevenue: "100.00",
      operatingProfit: "50.00",
      realNetProfit: "50.00",
      monthlyBurn: "40.00",
      requiredBuffer: "40.00",
      distributablePool: "10.00",
      remainingPool: "10.00",
      safeWithdrawalCeiling: "10.00",
      runwayMonths: "2.50",
      partnerBreakdown: [],
      riskStatus: {
        profitHealth: "healthy",
        withdrawalHealth: "safe",
        runwayHealth: "stable",
        overdrawn: false,
      },
      partnerMaxWithdrawal: {},
      clientMargin: {},
    };

    const redisService = {
      get: vi.fn().mockResolvedValueOnce(cached),
      set: vi.fn(),
    };
    const financialEngineService = {
      calculate: vi.fn(),
    };

    const service = new DashboardService(financialEngineService as never, redisService as never);

    await expect(service.summaryPreview()).resolves.toEqual(cached);
    expect(financialEngineService.calculate).not.toHaveBeenCalled();
    expect(redisService.set).not.toHaveBeenCalled();
  });

  it("calculates and caches summary when cache miss happens", async () => {
    const generated = {
      realizedRevenue: "450000.00",
      operatingProfit: "190000.00",
      realNetProfit: "190000.00",
      monthlyBurn: "350000.00",
      requiredBuffer: "350000.00",
      distributablePool: "-160000.00",
      remainingPool: "-190000.00",
      safeWithdrawalCeiling: "0.00",
      runwayMonths: "1.00",
      partnerBreakdown: [],
      riskStatus: {
        profitHealth: "caution",
        withdrawalHealth: "warning",
        runwayHealth: "monitor",
        overdrawn: true,
      },
      partnerMaxWithdrawal: {},
      clientMargin: {},
    };

    const redisService = {
      get: vi.fn().mockResolvedValueOnce(null),
      set: vi.fn().mockResolvedValueOnce(undefined),
    };
    const financialEngineService = {
      calculate: vi.fn().mockReturnValueOnce(generated),
    };

    const service = new DashboardService(financialEngineService as never, redisService as never);

    await expect(service.summaryPreview()).resolves.toEqual(generated);
    expect(financialEngineService.calculate).toHaveBeenCalledOnce();
    expect(redisService.set).toHaveBeenCalledWith("dashboard:summary:v1", generated, 30);
  });
});
