import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto.js";
import { OAuthTokenDto } from "./dto/oauth-token.dto.js";
import { RefreshTokenDto } from "./dto/refresh-token.dto.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { AuthService } from "./auth.service.js";
import type { AppUserRole } from "./auth.types.js";

interface RequestWithUser {
  user: {
    sub: string;
    email: string;
    role: AppUserRole;
  };
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() payload: LoginDto) {
    const tokenResponse = await this.authService.issueOAuthToken({
      grant_type: "password",
      client_id: "axioma-web-app",
      username: payload.email,
      password: payload.password,
    });

    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
    };
  }

  @Post("refresh")
  async refresh(@Body() payload: RefreshTokenDto) {
    const tokenResponse = await this.authService.issueOAuthToken({
      grant_type: "refresh_token",
      client_id: "axioma-web-app",
      refresh_token: payload.refreshToken,
    });

    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  logout(@Req() request: RequestWithUser) {
    return this.authService.logout(request.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() request: RequestWithUser) {
    return this.authService.me(request.user.sub);
  }
}

@Controller("oauth")
export class OAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("token")
  token(@Body() payload: OAuthTokenDto) {
    return this.authService.issueOAuthToken(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Post("revoke")
  revoke(@Req() request: RequestWithUser) {
    return this.authService.logout(request.user.sub);
  }
}
