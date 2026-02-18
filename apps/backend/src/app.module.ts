import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./common/health.controller.js";
import { DatabaseModule } from "./database/database.module.js";
import { RedisModule } from "./infrastructure/redis/redis.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { BufferSettingsModule } from "./modules/buffer-settings/buffer-settings.module.js";
import { DashboardModule } from "./modules/dashboard/dashboard.module.js";
import { EngineModule } from "./modules/engine/engine.module.js";
import { ExpensesModule } from "./modules/expenses/expenses.module.js";
import { IncomeModule } from "./modules/income/income.module.js";
import { PartnersModule } from "./modules/partners/partners.module.js";
import { SalarySettingsModule } from "./modules/salary-settings/salary-settings.module.js";
import { WithdrawalsModule } from "./modules/withdrawals/withdrawals.module.js";

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    EngineModule,
    DashboardModule,
    IncomeModule,
    ExpensesModule,
    WithdrawalsModule,
    PartnersModule,
    SalarySettingsModule,
    BufferSettingsModule,
  ],
})
export class AppModule {}
