import { describe, expect, it, vi } from "vitest";
import { HealthController } from "../src/common/health.controller.js";

describe("HealthController", () => {
  it("returns alive status for liveness endpoint", () => {
    const prismaService = {
      $queryRaw: vi.fn(),
    };
    const redisService = {
      getClientOrNull: vi.fn(() => null),
    };

    const controller = new HealthController(prismaService as never, redisService as never);

    expect(controller.live()).toEqual({ status: "alive" });
  });

  it("returns ready when database is healthy and redis is disabled", async () => {
    const prismaService = {
      $queryRaw: vi.fn().mockResolvedValueOnce([1]),
    };
    const redisService = {
      getClientOrNull: vi.fn(() => null),
    };

    const controller = new HealthController(prismaService as never, redisService as never);

    await expect(controller.ready()).resolves.toEqual({
      status: "ready",
      checks: {
        database: "ok",
        redis: "disabled",
      },
    });
  });

  it("returns degraded when redis ping fails", async () => {
    const prismaService = {
      $queryRaw: vi.fn().mockResolvedValueOnce([1]),
    };
    const redisService = {
      getClientOrNull: vi.fn(() => ({
        ping: vi.fn().mockRejectedValueOnce(new Error("down")),
      })),
    };

    const controller = new HealthController(prismaService as never, redisService as never);

    await expect(controller.ready()).resolves.toEqual({
      status: "degraded",
      checks: {
        database: "ok",
        redis: "fail",
      },
    });
  });
});
