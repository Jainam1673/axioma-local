import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { AppModule } from "./app.module.js";
import { RequestLoggingInterceptor } from "./common/request-logging.interceptor.js";
import { PrismaService } from "./database/prisma.service.js";
import { requestIdMiddleware } from "./common/request-id.middleware.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const prismaService = app.get(PrismaService);
  const port = Number(configService.get<string>("PORT") ?? "4000");
  const trustProxy = (configService.get<string>("APP_TRUST_PROXY") ?? "false") === "true";

  if (trustProxy) {
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  }

  app.use(requestIdMiddleware);
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.use(helmet());
  app.use(rateLimit({ windowMs: 60_000, limit: 150 }));
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  app.enableShutdownHooks();
  await prismaService.enableShutdownHooks(app);

  await app.listen(port, "0.0.0.0");
}

void bootstrap();
