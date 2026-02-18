import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import type { RequestWithId } from "./request-id.middleware.js";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithId & Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const startedAt = Date.now();
    const requestId = request.requestId ?? "unknown";

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startedAt;
          this.logger.log(
            `${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms request_id=${requestId}`,
          );
        },
        error: () => {
          const durationMs = Date.now() - startedAt;
          this.logger.error(
            `${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms request_id=${requestId}`,
          );
        },
      }),
    );
  }
}
