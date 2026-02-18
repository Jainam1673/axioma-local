import { Module } from "@nestjs/common";
import { ClientProfitabilityService } from "./client-profitability.service.js";
import { EngineController } from "./engine.controller.js";
import { FinancialEngineService } from "./financial-engine.service.js";
import { RiskEvaluatorService } from "./risk-evaluator.service.js";
import { WithdrawalSimulatorService } from "./withdrawal-simulator.service.js";

@Module({
  controllers: [EngineController],
  providers: [
    FinancialEngineService,
    WithdrawalSimulatorService,
    ClientProfitabilityService,
    RiskEvaluatorService,
  ],
  exports: [FinancialEngineService],
})
export class EngineModule {}
