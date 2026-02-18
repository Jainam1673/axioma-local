import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { UpsertSalarySettingDto } from "./salary-settings.dto.js";
import { SalarySettingsService } from "./salary-settings.service.js";

@Controller("salary-settings")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalarySettingsController {
  constructor(private readonly salarySettingsService: SalarySettingsService) {}

  @Post()
  @Roles("OWNER", "ADMIN")
  upsert(@Body() payload: UpsertSalarySettingDto) {
    return this.salarySettingsService.upsert(payload);
  }

  @Get("latest")
  @Roles("OWNER", "ADMIN", "MEMBER")
  latest() {
    return this.salarySettingsService.latest();
  }
}
