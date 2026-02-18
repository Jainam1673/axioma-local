import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { FinancialEngineInputDto, WithdrawalSimulationInputDto } from "./engine.dto.js";
import { FinancialEngineService } from "./financial-engine.service.js";
import type {
  FinancialEngineOutput,
  WithdrawalSimulationOutput,
} from "./engine.types.js";
import { WithdrawalSimulatorService } from "./withdrawal-simulator.service.js";

@Controller("engine")
@UseGuards(JwtAuthGuard, RolesGuard)
export class EngineController {
  constructor(
    private readonly financialEngineService: FinancialEngineService,
    private readonly withdrawalSimulatorService: WithdrawalSimulatorService,
  ) {}

  @Post("simulate")
  @Roles("OWNER", "ADMIN", "MEMBER")
  simulate(@Body() payload: FinancialEngineInputDto): FinancialEngineOutput {
    return this.financialEngineService.calculate(payload);
  }

  @Post("simulate-withdrawal")
  @Roles("OWNER", "ADMIN")
  simulateWithdrawal(@Body() payload: WithdrawalSimulationInputDto): WithdrawalSimulationOutput {
    return this.withdrawalSimulatorService.simulate(payload);
  }
}
