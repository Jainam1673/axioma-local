import { Injectable } from "@nestjs/common";
import { Decimal } from "decimal.js";
import type {
  FinancialEngineInput,
  FinancialEngineOutput,
} from "./engine.types.js";
import { ClientProfitabilityService } from "./client-profitability.service.js";
import { RiskEvaluatorService } from "./risk-evaluator.service.js";

@Injectable()
export class FinancialEngineService {
  constructor(
    private readonly clientProfitabilityService: ClientProfitabilityService,
    private readonly riskEvaluatorService: RiskEvaluatorService,
  ) {}

  calculate(input: FinancialEngineInput): FinancialEngineOutput {
    const realizedRevenue = this.toDecimal(input.realizedRevenue);
    const paidExpenses = this.toDecimal(input.paidExpenses);
    const salaries = this.toDecimal(input.salaries);
    const recurringExpenses = this.toDecimal(input.recurringExpenses ?? 0);
    const avgFixedCosts = this.toDecimal(input.avgFixedCosts ?? input.fixedMonthlyExpense);
    const bufferMonths = this.toDecimal(input.bufferMonths);

    const operatingProfit = realizedRevenue.minus(paidExpenses).minus(salaries);
    const monthlyBurn = salaries.plus(recurringExpenses).plus(avgFixedCosts);
    const requiredBuffer = monthlyBurn.times(bufferMonths);
    const distributablePool = operatingProfit.minus(requiredBuffer);
    const totalWithdrawn = this.toDecimal(
      input.totalWithdrawn ??
        input.partners.reduce(
          (sum, partner) => sum.plus(this.toDecimal(partner.alreadyWithdrawn)),
          new Decimal(0),
        ),
    );
    const remainingPool = distributablePool.minus(totalWithdrawn);
    const safeWithdrawalCeiling = Decimal.max(remainingPool, 0);

    const derivedCashBalance = realizedRevenue.minus(paidExpenses).minus(totalWithdrawn);
    const cashBalance = this.toDecimal(input.cashBalance ?? derivedCashBalance);

    const runwayMonths = monthlyBurn.gt(0)
      ? Decimal.max(cashBalance.div(monthlyBurn), 0)
      : new Decimal(0);

    const partnerBreakdown = input.partners.map((partner) => {
      const allowedTotal = distributablePool.times(this.toDecimal(partner.shareRatio));
      const withdrawnSoFar = this.toDecimal(partner.alreadyWithdrawn);
      const remainingLimit = allowedTotal.minus(withdrawnSoFar);

      return {
        partnerId: partner.partnerId,
        allowedTotal: this.currency(allowedTotal),
        withdrawnSoFar: this.currency(withdrawnSoFar),
        remainingLimit: this.currency(remainingLimit),
      };
    });

    const partnerMaxWithdrawal = partnerBreakdown.reduce<Record<string, string>>(
      (accumulator, item) => {
        accumulator[item.partnerId] = this.currency(Decimal.max(this.toDecimal(item.remainingLimit), 0));
        return accumulator;
      },
      {},
    );

    const riskStatus = this.riskEvaluatorService.evaluate({
      operatingProfit,
      requiredBuffer,
      remainingPool,
      totalWithdrawn,
      distributablePool,
      runwayMonths,
    });

    const clientMargin = this.clientProfitabilityService.calculate(input.clients ?? []);

    return {
      realizedRevenue: this.currency(realizedRevenue),
      operatingProfit: this.currency(operatingProfit),
      realNetProfit: this.currency(operatingProfit),
      monthlyBurn: this.currency(monthlyBurn),
      requiredBuffer: this.currency(requiredBuffer),
      distributablePool: this.currency(distributablePool),
      remainingPool: this.currency(remainingPool),
      safeWithdrawalCeiling: this.currency(safeWithdrawalCeiling),
      runwayMonths: this.decimal(runwayMonths),
      partnerBreakdown,
      riskStatus,
      partnerMaxWithdrawal,
      clientMargin,
    };
  }

  private toDecimal(value: string | number | Decimal): Decimal {
    return value instanceof Decimal ? value : new Decimal(value);
  }

  private currency(value: Decimal): string {
    return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString();
  }

  private decimal(value: Decimal): string {
    return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString();
  }
}
