# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

247 (Quivr) - A system for web terminal access to Claude Code from anywhere. Consists of a Bun-powered React SPA dashboard, local Bun agents (one per machine) with SQLite for local persistence, and Tailscale Tunnels for secure exposure.

**Domain:** 247.quivr.com

- To create a release of this project, use the `bun run release` command from the main worktree only (not session worktrees). This ensures proper versioning and tagging.
- The web app is stateless and uses localStorage for agent URL persistence. All session data is stored locally by the agent using SQLite.
- The `bun run release` command automates semantic versioning based on conventional commits
- Always add tests for new features and changes. Run `bun run test` before committing.
- Mutualise as much code as possible between web and agent using the `packages/shared` package for types and utilities.
- **Always add tests for new code** - Every new feature, function, or component must have corresponding tests
- **Never delete tests without confirmation** - Ask before removing any existing tests
- **Minimum 80% coverage** - New code should aim for 80%+ test coverage
- **Test existing patterns** - Check existing tests in `tests/` directories for patterns and helpers
- **Mock external dependencies** - Use `bun:test` mocks for external modules, browser APIs, and network calls

## Monorepo Structure

| Package | Purpose |
|---------|---------|
| `apps/web` | Bun SPA server + React dashboard (stateless, localStorage only) |
| `apps/agent` | Bun server, WebSocket terminal, PTY sessions |
| `packages/shared` | TypeScript types shared between web and agent |
| `packages/hooks` | Claude Code plugin for stop notifications |

## Important Rules

- **Never put `.github/workflows` inside `claude-remote-control/`** - All GitHub workflows must be at the repository root (`.github/workflows/`)

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:
1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes
