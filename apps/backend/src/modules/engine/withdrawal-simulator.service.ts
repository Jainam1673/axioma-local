import { Injectable } from "@nestjs/common";
import { Decimal } from "decimal.js";
import type { WithdrawalSimulationInput, WithdrawalSimulationOutput } from "./engine.types.js";

@Injectable()
export class WithdrawalSimulatorService {
  simulate(input: WithdrawalSimulationInput): WithdrawalSimulationOutput {
    const requestedAmount = new Decimal(input.requestedAmount);
    const currentCash = new Decimal(input.currentCashBalance);
    const monthlyBurn = new Decimal(input.monthlyBurn);
    const remainingPool = new Decimal(input.remainingPool);

    const newCashBalance = currentCash.minus(requestedAmount);
    const newRemainingPool = remainingPool.minus(requestedAmount);

    const newRunway = monthlyBurn.gt(0)
      ? Decimal.max(newCashBalance.div(monthlyBurn), 0)
      : new Decimal(0);

    const blocked = newRemainingPool.lt(0);
    const riskLevel = this.riskLevel(newRunway);

    return {
      blocked,
      riskLevel,
      decision: blocked ? "block" : "allow",
      newCashBalance: this.currency(newCashBalance),
      newRunwayMonths: this.decimal(newRunway),
      newRemainingPool: this.currency(newRemainingPool),
      reason: blocked
        ? "Requested amount exceeds remaining distributable pool"
        : riskLevel === "high"
          ? "Withdrawal allowed with high runway risk"
          : riskLevel === "medium"
            ? "Withdrawal allowed with medium runway risk"
            : "Withdrawal allowed",
    };
  }

  private riskLevel(runwayMonths: Decimal): "safe" | "medium" | "high" {
    if (runwayMonths.lt(1)) {
      return "high";
    }

    if (runwayMonths.lte(2)) {
      return "medium";
    }

    return "safe";
  }

  private currency(value: Decimal): string {
    return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString();
  }

  private decimal(value: Decimal): string {
    return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString();
  }
}
