import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";
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
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
        PORT: Joi.number().port().default(4000),
        DATABASE_URL: Joi.string().uri({ scheme: ["postgresql", "postgres"] }).required(),
        REDIS_URL: Joi.string().uri({ scheme: ["redis", "rediss"] }).optional(),
        JWT_ACCESS_SECRET: Joi.string().min(16).required(),
        JWT_REFRESH_SECRET: Joi.string().min(16).required(),
        JWT_ACCESS_TTL: Joi.number().integer().positive().default(900),
        JWT_REFRESH_TTL: Joi.number().integer().positive().default(2592000),
        OAUTH_PUBLIC_CLIENT_ID: Joi.string().min(3).required(),
        OAUTH_CONFIDENTIAL_CLIENT_ID: Joi.string().min(3).required(),
        OAUTH_CONFIDENTIAL_CLIENT_SECRET: Joi.string().min(16).required(),
        OAUTH_DEFAULT_SCOPE: Joi.string().default("read write"),
        APP_TRUST_PROXY: Joi.boolean().truthy("true").falsy("false").default(false),
      }),
      validationOptions: {
        abortEarly: false,
      },
    }),
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
