import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  get client(): Redis {
    if (!this.redisClient) {
      throw new Error("Redis client is not initialized");
    }

    return this.redisClient;
  }

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>("REDIS_URL");
    if (!redisUrl) {
      this.logger.warn("REDIS_URL is not set; Redis integration is disabled.");
      return;
    }

    this.redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
    });

    this.redisClient.on("error", (error: unknown) => {
      this.logger.error(`Redis connection error: ${String(error)}`);
    });

    await this.redisClient.connect();
    this.logger.log("Redis connected successfully.");
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redisClient) {
      return null;
    }

    const value = await this.redisClient.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    await this.redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }
}
