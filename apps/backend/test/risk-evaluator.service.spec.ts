import { Decimal } from "decimal.js";
import { describe, expect, it } from "vitest";
import { RiskEvaluatorService } from "../src/modules/engine/risk-evaluator.service.js";

describe("RiskEvaluatorService", () => {
  const service = new RiskEvaluatorService();

  it("returns healthy/safe/stable for strong financial posture", () => {
    const result = service.evaluate({
      operatingProfit: new Decimal(500000),
      requiredBuffer: new Decimal(200000),
      remainingPool: new Decimal(100000),
      totalWithdrawn: new Decimal(20000),
      distributablePool: new Decimal(150000),
      runwayMonths: new Decimal(6),
    });

    expect(result.profitHealth).toBe("healthy");
    expect(result.withdrawalHealth).toBe("safe");
    expect(result.runwayHealth).toBe("stable");
    expect(result.overdrawn).toBe(false);
  });

  it("returns caution/warning/monitor for constrained but viable state", () => {
    const result = service.evaluate({
      operatingProfit: new Decimal(90000),
      requiredBuffer: new Decimal(100000),
      remainingPool: new Decimal(5000),
      totalWithdrawn: new Decimal(81000),
      distributablePool: new Decimal(100000),
      runwayMonths: new Decimal(2),
    });

    expect(result.profitHealth).toBe("caution");
    expect(result.withdrawalHealth).toBe("warning");
    expect(result.runwayHealth).toBe("monitor");
  });

  it("returns critical/alert/critical for overdrawn state", () => {
    const result = service.evaluate({
      operatingProfit: new Decimal(-10),
      requiredBuffer: new Decimal(1000),
      remainingPool: new Decimal(-1),
      totalWithdrawn: new Decimal(1500),
      distributablePool: new Decimal(1000),
      runwayMonths: new Decimal(0.5),
    });

    expect(result.profitHealth).toBe("critical");
    expect(result.withdrawalHealth).toBe("alert");
    expect(result.runwayHealth).toBe("critical");
    expect(result.overdrawn).toBe(true);
  });

  it("returns safe withdrawal health when distributable pool is zero and no withdrawals", () => {
    const result = service.evaluate({
      operatingProfit: new Decimal(0),
      requiredBuffer: new Decimal(1),
      remainingPool: new Decimal(0),
      totalWithdrawn: new Decimal(0),
      distributablePool: new Decimal(0),
      runwayMonths: new Decimal(4),
    });

    expect(result.withdrawalHealth).toBe("safe");
  });
});
