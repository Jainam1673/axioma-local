import { Controller, Get, UseGuards } from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { DashboardService } from "./dashboard.service.js";
import type { FinancialEngineOutput } from "../engine/engine.types.js";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("summary")
  @Roles("OWNER", "ADMIN", "MEMBER")
  async getSummary(): Promise<FinancialEngineOutput> {
    return this.dashboardService.summaryPreview();
  }
}
