import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { RedisService } from "../infrastructure/redis/redis.service.js";

@Controller()
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get("health")
  health(): { status: string; service: string } {
    return { status: "ok", service: "axioma-backend" };
  }

  @Get("health/live")
  live(): { status: string } {
    return { status: "alive" };
  }

  @Get("health/ready")
  async ready(): Promise<{
    status: "ready" | "degraded";
    checks: { database: "ok" | "fail"; redis: "ok" | "disabled" | "fail" };
  }> {
    let databaseStatus: "ok" | "fail" = "ok";
    let redisStatus: "ok" | "disabled" | "fail" = "disabled";

    try {
      await this.prismaService.$queryRaw`SELECT 1`;
    } catch {
      databaseStatus = "fail";
    }

    const redisClient = this.redisService.getClientOrNull();
    if (redisClient) {
      try {
        const pong = await redisClient.ping();
        redisStatus = pong === "PONG" ? "ok" : "fail";
      } catch {
        redisStatus = "fail";
      }
    }

    const status = databaseStatus === "ok" && redisStatus !== "fail" ? "ready" : "degraded";

    return {
      status,
      checks: {
        database: databaseStatus,
        redis: redisStatus,
      },
    };
  }
}
