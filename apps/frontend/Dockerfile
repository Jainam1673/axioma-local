FROM oven/bun:1.3.5-alpine AS deps
WORKDIR /workspace/apps/frontend
COPY apps/frontend/package.json ./package.json
COPY bun.lock* ./
RUN bun install --frozen-lockfile || bun install

FROM deps AS build
WORKDIR /workspace
COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/frontend ./apps/frontend
WORKDIR /workspace/apps/frontend
RUN bun run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S app && adduser -S app -G app

COPY --from=build /workspace/apps/frontend/public ./public
COPY --from=build --chown=app:app /workspace/apps/frontend/.next/standalone ./
COPY --from=build --chown=app:app /workspace/apps/frontend/.next/static ./.next/static

USER app
EXPOSE 3000

CMD ["node", "server.js"]
