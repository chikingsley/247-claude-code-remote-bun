# 247 (Quivr)

Web terminal access to Claude Code from anywhere.

## Quick Start

```bash
pnpm install
pnpm dev
```

## Architecture

- **apps/web** - Next.js dashboard (Vercel)
- **apps/agent** - Local Node.js agent with WebSocket terminal
- **packages/cli** - CLI tool for agent management
- **packages/shared** - Shared TypeScript types
