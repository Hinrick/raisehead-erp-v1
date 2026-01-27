FROM node:22-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml .npmrc tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN pnpm db:generate
RUN pnpm build

# Production
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json pnpm-lock.yaml .npmrc ./
COPY prisma ./prisma
COPY assets ./assets
RUN pnpm db:generate
RUN mkdir -p /app/uploads/namecards
EXPOSE 3000
CMD ["node", "dist/server.js"]
