import { Injectable } from "@nestjs/common";
import { RedisService } from "../../infrastructure/redis/redis.service.js";
import { FinancialEngineService } from "../engine/financial-engine.service.js";
import type { FinancialEngineOutput } from "../engine/engine.types.js";

@Injectable()
export class DashboardService {
  private readonly summaryCacheKey = "dashboard:summary:v1";

  constructor(
    private readonly financialEngineService: FinancialEngineService,
    private readonly redisService: RedisService,
  ) {}

  async summaryPreview(): Promise<FinancialEngineOutput> {
    const cached = await this.redisService.get<FinancialEngineOutput>(this.summaryCacheKey);
    if (cached) {
      return cached;
    }

    const summary = this.financialEngineService.calculate({
      realizedRevenue: 450000,
      paidExpenses: 120000,
      salaries: 140000,
      fixedMonthlyExpense: 210000,
      bufferMonths: 1,
      partners: [
        { partnerId: "partner_a", shareRatio: 0.6, alreadyWithdrawn: 20000 },
        { partnerId: "partner_b", shareRatio: 0.4, alreadyWithdrawn: 10000 },
      ],
      clients: [
        { clientId: "client_alpha", realizedRevenue: 250000, paidExpense: 110000 },
        { clientId: "client_beta", realizedRevenue: 200000, paidExpense: 120000 },
      ],
    });

    await this.redisService.set(this.summaryCacheKey, summary, 30);
    return summary;
  }
}
