import { Module } from "@nestjs/common";
import { EngineModule } from "../engine/engine.module.js";
import { DashboardController } from "./dashboard.controller.js";
import { DashboardService } from "./dashboard.service.js";

@Module({
  imports: [EngineModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
