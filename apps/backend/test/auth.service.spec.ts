import { UnauthorizedException } from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "../src/modules/auth/auth.service.js";

describe("AuthService", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockJwt = {
    signAsync: vi.fn(),
    verifyAsync: vi.fn(),
  } as unknown as JwtService;

  const mockConfig = {
    get: vi.fn((key: string) => {
      if (key === "JWT_ACCESS_SECRET") return "access-secret";
      if (key === "JWT_REFRESH_SECRET") return "refresh-secret";
      if (key === "JWT_ACCESS_TTL") return "900";
      if (key === "JWT_REFRESH_TTL") return "2592000";
      if (key === "OAUTH_PUBLIC_CLIENT_ID") return "axioma-web-app";
      if (key === "OAUTH_CONFIDENTIAL_CLIENT_ID") return "axioma-vps-client";
      if (key === "OAUTH_CONFIDENTIAL_CLIENT_SECRET") return "confidential-secret";
      if (key === "OAUTH_DEFAULT_SCOPE") return "read write";
      return undefined;
    }),
  };

  const service = new AuthService(mockPrisma as never, mockJwt, mockConfig as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid login credentials", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(service.login("x@example.com", "badpass123")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("issues tokens on valid login", async () => {
    const bcrypt = await import("bcrypt");
    const passwordHash = await bcrypt.hash("Owner@12345", 10);

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "owner@axioma.local",
      passwordHash,
      role: "OWNER",
    });

    vi.mocked(mockJwt.signAsync)
      .mockResolvedValueOnce("access-token")
      .mockResolvedValueOnce("refresh-token");

    mockPrisma.user.update.mockResolvedValueOnce({ id: "u1" });

    const result = await service.login("owner@axioma.local", "Owner@12345");

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
  });

  it("rejects login with wrong password", async () => {
    const bcrypt = await import("bcrypt");
    const passwordHash = await bcrypt.hash("Owner@12345", 10);

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "owner@axioma.local",
      passwordHash,
      role: "OWNER",
    });

    await expect(service.login("owner@axioma.local", "WrongPassword@1")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("refreshes tokens when refresh token is valid", async () => {
    const bcrypt = await import("bcrypt");
    const refreshToken = "valid-refresh-token-long-enough";
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    vi.mocked(mockJwt.verifyAsync).mockResolvedValueOnce({
      sub: "u1",
      email: "owner@axioma.local",
      role: "OWNER",
    });

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "owner@axioma.local",
      role: "OWNER",
      refreshTokenHash,
    });

    vi.mocked(mockJwt.signAsync)
      .mockResolvedValueOnce("new-access")
      .mockResolvedValueOnce("new-refresh");

    mockPrisma.user.update.mockResolvedValueOnce({ id: "u1" });

    const tokens = await service.refresh(refreshToken);

    expect(tokens.accessToken).toBe("new-access");
    expect(tokens.refreshToken).toBe("new-refresh");
  });

  it("rejects refresh when token verification fails", async () => {
    vi.mocked(mockJwt.verifyAsync).mockRejectedValueOnce(new Error("invalid"));

    await expect(service.refresh("bad-refresh-token")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects refresh when user has no stored refresh hash", async () => {
    vi.mocked(mockJwt.verifyAsync).mockResolvedValueOnce({
      sub: "u1",
      email: "owner@axioma.local",
      role: "OWNER",
    });

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "owner@axioma.local",
      role: "OWNER",
      refreshTokenHash: null,
    });

    await expect(service.refresh("valid-refresh-token-long-enough")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects refresh when provided token does not match stored hash", async () => {
    const bcrypt = await import("bcrypt");
    const storedHash = await bcrypt.hash("different-refresh-token-long-enough", 10);

    vi.mocked(mockJwt.verifyAsync).mockResolvedValueOnce({
      sub: "u1",
      email: "owner@axioma.local",
      role: "OWNER",
    });

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "owner@axioma.local",
      role: "OWNER",
      refreshTokenHash: storedHash,
    });

    await expect(service.refresh("valid-refresh-token-long-enough")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects refresh when token user cannot be found", async () => {
    vi.mocked(mockJwt.verifyAsync).mockResolvedValueOnce({
      sub: "missing-user",
      email: "missing@axioma.local",
      role: "OWNER",
    });

    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(service.refresh("valid-refresh-token-long-enough")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("returns current authenticated user profile", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "owner@axioma.local",
      role: "OWNER",
    });

    const profile = await service.me("u1");
    expect(profile.email).toBe("owner@axioma.local");
    expect(profile.role).toBe("OWNER");
  });

  it("throws unauthorized when current user no longer exists", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(service.me("missing-user")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("clears refresh token hash on logout", async () => {
    mockPrisma.user.update.mockResolvedValueOnce({ id: "u1" });

    const response = await service.logout("u1");

    expect(response.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { refreshTokenHash: null },
    });
  });

  it("issues OAuth2 token for password grant", async () => {
    const bcrypt = await import("bcrypt");
    const passwordHash = await bcrypt.hash("Owner@12345", 10);

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "owner@axioma.local",
      passwordHash,
      role: "OWNER",
    });

    vi.mocked(mockJwt.signAsync)
      .mockResolvedValueOnce("oauth-access-token")
      .mockResolvedValueOnce("oauth-refresh-token");

    mockPrisma.user.update.mockResolvedValueOnce({ id: "u1" });

    const response = await service.issueOAuthToken({
      grant_type: "password",
      client_id: "axioma-web-app",
      username: "owner@axioma.local",
      password: "Owner@12345",
    });

    expect(response.access_token).toBe("oauth-access-token");
    expect(response.refresh_token).toBe("oauth-refresh-token");
    expect(response.token_type).toBe("Bearer");
    expect(response.scope).toBe("read write");
  });

  it("issues OAuth2 token for refresh_token grant", async () => {
    const bcrypt = await import("bcrypt");
    const refreshToken = "valid-refresh-token-long-enough";
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    vi.mocked(mockJwt.verifyAsync).mockResolvedValueOnce({
      sub: "u1",
      email: "owner@axioma.local",
      role: "OWNER",
    });

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "owner@axioma.local",
      role: "OWNER",
      refreshTokenHash,
    });

    vi.mocked(mockJwt.signAsync)
      .mockResolvedValueOnce("new-oauth-access")
      .mockResolvedValueOnce("new-oauth-refresh");

    mockPrisma.user.update.mockResolvedValueOnce({ id: "u1" });

    const response = await service.issueOAuthToken({
      grant_type: "refresh_token",
      client_id: "axioma-web-app",
      refresh_token: refreshToken,
    });

    expect(response.access_token).toBe("new-oauth-access");
    expect(response.refresh_token).toBe("new-oauth-refresh");
  });

  it("rejects OAuth2 token request for unauthorized client", async () => {
    await expect(
      service.issueOAuthToken({
        grant_type: "password",
        client_id: "unknown-client",
        username: "owner@axioma.local",
        password: "Owner@12345",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("accepts confidential client when secret matches", async () => {
    const bcrypt = await import("bcrypt");
    const passwordHash = await bcrypt.hash("Owner@12345", 10);

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "owner@axioma.local",
      passwordHash,
      role: "OWNER",
    });

    vi.mocked(mockJwt.signAsync)
      .mockResolvedValueOnce("conf-access")
      .mockResolvedValueOnce("conf-refresh");

    mockPrisma.user.update.mockResolvedValueOnce({ id: "u1" });

    const response = await service.issueOAuthToken({
      grant_type: "password",
      client_id: "axioma-vps-client",
      client_secret: "confidential-secret",
      username: "owner@axioma.local",
      password: "Owner@12345",
    });

    expect(response.access_token).toBe("conf-access");
    expect(response.refresh_token).toBe("conf-refresh");
  });

  it("rejects password grant when username or password is missing", async () => {
    await expect(
      service.issueOAuthToken({
        grant_type: "password",
        client_id: "axioma-web-app",
        username: "owner@axioma.local",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects refresh_token grant when refresh_token is missing", async () => {
    await expect(
      service.issueOAuthToken({
        grant_type: "refresh_token",
        client_id: "axioma-web-app",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects confidential client when secret is invalid", async () => {
    await expect(
      service.issueOAuthToken({
        grant_type: "password",
        client_id: "axioma-vps-client",
        client_secret: "wrong-secret",
        username: "owner@axioma.local",
        password: "Owner@12345",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects confidential client when secret is missing", async () => {
    await expect(
      service.issueOAuthToken({
        grant_type: "password",
        client_id: "axioma-vps-client",
        username: "owner@axioma.local",
        password: "Owner@12345",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("returns requested scope when scope is explicitly provided", async () => {
    const bcrypt = await import("bcrypt");
    const passwordHash = await bcrypt.hash("Owner@12345", 10);

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "owner@axioma.local",
      passwordHash,
      role: "OWNER",
    });

    vi.mocked(mockJwt.signAsync)
      .mockResolvedValueOnce("scope-access")
      .mockResolvedValueOnce("scope-refresh");

    mockPrisma.user.update.mockResolvedValueOnce({ id: "u1" });

    const response = await service.issueOAuthToken({
      grant_type: "password",
      client_id: "axioma-web-app",
      username: "owner@axioma.local",
      password: "Owner@12345",
      scope: "read",
    });

    expect(response.scope).toBe("read");
  });
});
