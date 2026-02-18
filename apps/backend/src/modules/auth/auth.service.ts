import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../database/prisma.service.js";
import type { OAuthTokenDto } from "./dto/oauth-token.dto.js";
import type { OAuthTokenResponse } from "./auth.oauth.types.js";
import type { AppUserRole } from "./auth.types.js";
import type { JwtPayload } from "./strategies/jwt.strategy.js";

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<Tokens> {
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async issueOAuthToken(payload: OAuthTokenDto): Promise<OAuthTokenResponse> {
    this.validateOAuthClient(payload.client_id, payload.client_secret);

    if (payload.grant_type === "password") {
      if (!payload.username || !payload.password) {
        throw new UnauthorizedException("Missing username or password for password grant");
      }

      const tokens = await this.login(payload.username, payload.password);
      return this.toOAuthTokenResponse(tokens, payload.scope);
    }

    if (!payload.refresh_token) {
      throw new UnauthorizedException("Missing refresh token for refresh_token grant");
    }

    const tokens = await this.refresh(payload.refresh_token);
    return this.toOAuthTokenResponse(tokens, payload.scope);
  }

  async refresh(refreshToken: string): Promise<Tokens> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const user = await this.prismaService.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException("Refresh token invalid");
    }

    const isRefreshValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isRefreshValid) {
      throw new UnauthorizedException("Refresh token invalid");
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<{ success: boolean }> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });

    return { success: true };
  }

  async me(userId: string): Promise<{ id: string; email: string; role: AppUserRole }> {
    const user = await this.prismaService.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  private async generateTokens(payload: JwtPayload): Promise<Tokens> {
    const accessSecret = this.configService.get<string>("JWT_ACCESS_SECRET") ?? "change_me_access";
    const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET") ?? "change_me_refresh";
    const accessTtl = Number(this.configService.get<string>("JWT_ACCESS_TTL") ?? "900");
    const refreshTtl = Number(this.configService.get<string>("JWT_REFRESH_TTL") ?? "2592000");

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessTtl,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: refreshTtl,
    });

    return { accessToken, refreshToken };
  }

  private toOAuthTokenResponse(tokens: Tokens, scope?: string): OAuthTokenResponse {
    const accessTtl = Number(this.configService.get<string>("JWT_ACCESS_TTL") ?? "900");
    const defaultScope = this.configService.get<string>("OAUTH_DEFAULT_SCOPE") ?? "read write";

    return {
      access_token: tokens.accessToken,
      token_type: "Bearer",
      expires_in: accessTtl,
      refresh_token: tokens.refreshToken,
      scope: scope ?? defaultScope,
    };
  }

  private validateOAuthClient(clientId: string, clientSecret?: string): void {
    const allowedPublicClientId = this.configService.get<string>("OAUTH_PUBLIC_CLIENT_ID") ?? "axioma-web-app";
    const allowedConfidentialClientId =
      this.configService.get<string>("OAUTH_CONFIDENTIAL_CLIENT_ID") ?? "axioma-vps-client";
    const confidentialSecret = this.configService.get<string>("OAUTH_CONFIDENTIAL_CLIENT_SECRET");

    if (clientId === allowedPublicClientId) {
      return;
    }

    if (clientId === allowedConfidentialClientId && confidentialSecret && clientSecret) {
      if (clientSecret !== confidentialSecret) {
        throw new UnauthorizedException("Invalid OAuth client credentials");
      }

      return;
    }

    throw new UnauthorizedException("OAuth client is not authorized");
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET") ?? "change_me_refresh";
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException("Refresh token invalid");
    }
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prismaService.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }
}
