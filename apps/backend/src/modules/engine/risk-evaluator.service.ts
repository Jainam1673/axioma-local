import { Injectable } from "@nestjs/common";
import { Decimal } from "decimal.js";
import type { RiskStatus } from "./engine.types.js";

@Injectable()
export class RiskEvaluatorService {
  evaluate(input: {
    operatingProfit: Decimal;
    requiredBuffer: Decimal;
    remainingPool: Decimal;
    totalWithdrawn: Decimal;
    distributablePool: Decimal;
    runwayMonths: Decimal;
  }): RiskStatus {
    const profitHealth = this.profitHealth(input.operatingProfit, input.requiredBuffer);
    const withdrawalHealth = this.withdrawalHealth(input.totalWithdrawn, input.distributablePool);
    const runwayHealth = this.runwayHealth(input.runwayMonths);

    return {
      profitHealth,
      withdrawalHealth,
      runwayHealth,
      overdrawn: input.remainingPool.lt(0),
    };
  }

  private profitHealth(operatingProfit: Decimal, requiredBuffer: Decimal): "healthy" | "caution" | "critical" {
    if (operatingProfit.lt(0)) {
      return "critical";
    }

    if (operatingProfit.lt(requiredBuffer)) {
      return "caution";
    }

    return "healthy";
  }

  private withdrawalHealth(totalWithdrawn: Decimal, distributablePool: Decimal): "safe" | "warning" | "alert" {
    if (distributablePool.lte(0)) {
      return totalWithdrawn.gt(0) ? "alert" : "safe";
    }

    const utilization = totalWithdrawn.div(distributablePool);

    if (utilization.gt(1)) {
      return "alert";
    }

    if (utilization.gte(0.8)) {
      return "warning";
    }

    return "safe";
  }

  private runwayHealth(runwayMonths: Decimal): "stable" | "monitor" | "critical" {
    if (runwayMonths.lt(1)) {
      return "critical";
    }

    if (runwayMonths.lte(3)) {
      return "monitor";
    }

    return "stable";
  }
}
