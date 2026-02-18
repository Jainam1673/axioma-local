import type { Reflector } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";
import { RolesGuard } from "../src/modules/auth/guards/roles.guard.js";

describe("RolesGuard", () => {
  const reflector = {
    getAllAndOverride: vi.fn(),
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);

  it("allows when no roles metadata is defined", () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValueOnce(undefined);

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: "MEMBER" } }),
      }),
    } as never;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows when user role matches required roles", () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValueOnce(["OWNER"]);

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: "OWNER" } }),
      }),
    } as never;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("blocks when user role does not match required roles", () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValueOnce(["OWNER", "ADMIN"]);

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: "MEMBER" } }),
      }),
    } as never;

    expect(guard.canActivate(context)).toBe(false);
  });
});
