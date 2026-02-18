import { Module } from "@nestjs/common";
import { SalarySettingsController } from "./salary-settings.controller.js";
import { SalarySettingsService } from "./salary-settings.service.js";

@Module({
  controllers: [SalarySettingsController],
  providers: [SalarySettingsService],
})
export class SalarySettingsModule {}
