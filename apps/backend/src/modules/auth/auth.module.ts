import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController, OAuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { RolesGuard } from "./guards/roles.guard.js";
import { JwtStrategy } from "./strategies/jwt.strategy.js";

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController, OAuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}
