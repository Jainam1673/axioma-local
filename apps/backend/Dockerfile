FROM oven/bun:1.3.5-alpine AS deps
WORKDIR /app
COPY apps/backend/package.json ./package.json
COPY bun.lock* ./
RUN bun install --frozen-lockfile || bun install

FROM deps AS prod-deps
RUN bun install --production --frozen-lockfile || bun install --production

FROM deps AS build
WORKDIR /app
COPY tsconfig.base.json /tsconfig.base.json
COPY apps/backend/tsconfig.json apps/backend/tsconfig.build.json apps/backend/nest-cli.json ./
COPY apps/backend/prisma ./prisma
COPY apps/backend/src ./src
RUN bun run prisma:generate && bun run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup -S app && adduser -S app -G app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/dist ./dist
COPY apps/backend/package.json ./package.json
COPY apps/backend/prisma ./prisma

USER app
EXPOSE 4000

CMD ["node", "dist/main.js"]
