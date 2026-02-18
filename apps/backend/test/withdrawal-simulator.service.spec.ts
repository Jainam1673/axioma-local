import { describe, expect, it } from "vitest";
import { WithdrawalSimulatorService } from "../src/modules/engine/withdrawal-simulator.service.js";

describe("WithdrawalSimulatorService", () => {
  const service = new WithdrawalSimulatorService();

  it("blocks over-withdrawals that push remaining pool below zero", () => {
    const result = service.simulate({
      requestedAmount: 50000,
      partnerId: "p1",
      currentCashBalance: 300000,
      monthlyBurn: 80000,
      remainingPool: 30000,
    });

    expect(result.blocked).toBe(true);
    expect(result.decision).toBe("block");
    expect(result.newRemainingPool).toBe("-20000");
  });

  it("marks high risk for runway below one month", () => {
    const result = service.simulate({
      requestedAmount: 60000,
      partnerId: "p1",
      currentCashBalance: 90000,
      monthlyBurn: 40000,
      remainingPool: 100000,
    });

    expect(result.blocked).toBe(false);
    expect(result.riskLevel).toBe("high");
    expect(result.newRunwayMonths).toBe("0.75");
  });

  it("marks medium risk for runway between one and two months", () => {
    const result = service.simulate({
      requestedAmount: 50000,
      partnerId: "p1",
      currentCashBalance: 120000,
      monthlyBurn: 50000,
      remainingPool: 100000,
    });

    expect(result.blocked).toBe(false);
    expect(result.riskLevel).toBe("medium");
    expect(result.newRunwayMonths).toBe("1.4");
  });

  it("marks safe when runway remains above two months", () => {
    const result = service.simulate({
      requestedAmount: 10000,
      partnerId: "p1",
      currentCashBalance: 250000,
      monthlyBurn: 50000,
      remainingPool: 100000,
    });

    expect(result.blocked).toBe(false);
    expect(result.riskLevel).toBe("safe");
    expect(result.newRunwayMonths).toBe("4.8");
  });
});
