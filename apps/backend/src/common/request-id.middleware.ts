import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

export interface RequestWithId extends Request {
  requestId?: string;
}

export function requestIdMiddleware(request: RequestWithId, response: Response, next: NextFunction): void {
  const incomingHeader = request.header("x-request-id");
  const requestId = incomingHeader && incomingHeader.trim().length > 0 ? incomingHeader : randomUUID();

  request.requestId = requestId;
  response.setHeader("x-request-id", requestId);

  next();
}
