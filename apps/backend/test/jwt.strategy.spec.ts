import { describe, expect, it } from "vitest";
import { JwtStrategy } from "../src/modules/auth/strategies/jwt.strategy.js";

describe("JwtStrategy", () => {
  it("validates and returns jwt payload", () => {
    const strategy = new JwtStrategy({
      get: () => "access-secret",
    } as never);

    const payload = {
      sub: "u1",
      email: "owner@axioma.local",
      role: "OWNER" as const,
    };

    expect(strategy.validate(payload)).toEqual(payload);
  });

  it("constructs with fallback secret when config is missing", () => {
    const strategy = new JwtStrategy({
      get: () => undefined,
    } as never);

    const payload = {
      sub: "u2",
      email: "member@axioma.local",
      role: "MEMBER" as const,
    };

    expect(strategy.validate(payload)).toEqual(payload);
  });
});
