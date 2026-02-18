import { Injectable } from "@nestjs/common";
import { Decimal } from "decimal.js";
import type { ClientProfitabilityInput, ClientProfitabilityOutput } from "./engine.types.js";

@Injectable()
export class ClientProfitabilityService {
  calculate(clients: ClientProfitabilityInput[]): Record<string, ClientProfitabilityOutput> {
    return clients.reduce<Record<string, ClientProfitabilityOutput>>((accumulator, client) => {
      const realizedRevenue = new Decimal(client.realizedRevenue);
      const directExpenses = new Decimal(client.directExpenses ?? client.paidExpense ?? 0);
      const allocatedSalary = new Decimal(client.allocatedSalary ?? 0);
      const proportionalOverhead = new Decimal(client.proportionalOverhead ?? 0);
      const estimatedCost = directExpenses.plus(allocatedSalary).plus(proportionalOverhead);
      const marginAmount = realizedRevenue.minus(estimatedCost);
      const marginPercent = realizedRevenue.gt(0)
        ? marginAmount.div(realizedRevenue).times(100)
        : new Decimal(0);

      accumulator[client.clientId] = {
        realizedRevenue: this.currency(realizedRevenue),
        estimatedCost: this.currency(estimatedCost),
        marginAmount: this.currency(marginAmount),
        marginPercent: this.decimal(marginPercent),
      };

      return accumulator;
    }, {});
  }

  private currency(value: Decimal): string {
    return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString();
  }

  private decimal(value: Decimal): string {
    return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString();
  }
}
