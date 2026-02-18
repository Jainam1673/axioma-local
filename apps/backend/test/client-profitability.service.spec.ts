import { describe, expect, it } from "vitest";
import { ClientProfitabilityService } from "../src/modules/engine/client-profitability.service.js";

describe("ClientProfitabilityService", () => {
  const service = new ClientProfitabilityService();

  it("calculates margins with direct expenses + salary + overhead", () => {
    const result = service.calculate([
      {
        clientId: "c1",
        realizedRevenue: 100000,
        directExpenses: 20000,
        allocatedSalary: 15000,
        proportionalOverhead: 5000,
      },
    ]);

    expect(result.c1.realizedRevenue).toBe("100000");
    expect(result.c1.estimatedCost).toBe("40000");
    expect(result.c1.marginAmount).toBe("60000");
    expect(result.c1.marginPercent).toBe("60");
  });

  it("falls back to paidExpense when granular costs missing", () => {
    const result = service.calculate([
      {
        clientId: "c2",
        realizedRevenue: 250000,
        paidExpense: 175000,
      },
    ]);

    expect(result.c2.estimatedCost).toBe("175000");
    expect(result.c2.marginAmount).toBe("75000");
    expect(result.c2.marginPercent).toBe("30");
  });

  it("handles zero revenue without divide-by-zero", () => {
    const result = service.calculate([
      {
        clientId: "c3",
        realizedRevenue: 0,
        paidExpense: 2000,
      },
    ]);

    expect(result.c3.marginAmount).toBe("-2000");
    expect(result.c3.marginPercent).toBe("0");
  });

  it("defaults estimated cost to zero when no cost inputs are provided", () => {
    const result = service.calculate([
      {
        clientId: "c4",
        realizedRevenue: 50000,
      },
    ]);

    expect(result.c4.estimatedCost).toBe("0");
    expect(result.c4.marginAmount).toBe("50000");
    expect(result.c4.marginPercent).toBe("100");
  });
});
