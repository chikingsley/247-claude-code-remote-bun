# 247 Agent Dockerfile
# Runs the agent server with terminal support via tmux

FROM oven/bun:latest

# Install tmux and other dependencies
RUN apt-get update && apt-get install -y \
    tmux \
    git \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY apps/agent/package.json ./apps/agent/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY apps/agent/ ./apps/agent/
COPY packages/shared/ ./packages/shared/

# Build
RUN bun run build

# Create data directory for SQLite
RUN mkdir -p /root/.247/data

# Expose port
EXPOSE 4678

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4678/health || exit 1

# Start agent
WORKDIR /app/apps/agent
CMD ["bun", "dist/index.js"]
