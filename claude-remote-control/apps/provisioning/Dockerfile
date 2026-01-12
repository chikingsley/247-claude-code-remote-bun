# Standalone Dockerfile for 247-provisioning
# Build from apps/provisioning directory

FROM node:22-slim AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (will generate lockfile if missing)
RUN pnpm install

# Copy source
COPY tsconfig.json ./
COPY src/ src/

# Build
RUN pnpm build

# Production stage
FROM node:22-slim AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --prod

# Copy built files
COPY --from=builder /app/dist ./dist

# Set environment
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "dist/index.js"]
