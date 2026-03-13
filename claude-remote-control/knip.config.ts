import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    ".": {
      entry: ["scripts/**/*.ts", "tools/**/*.ts", "tests/**/*.test.ts"],
      project: ["scripts/**/*.ts", "tools/**/*.ts", "tests/**/*.ts"],
    },
    "apps/agent": {
      entry: ["src/index.ts", "src/server.ts", "tests/**/*.test.ts"],
      project: ["src/**/*.ts", "tests/**/*.ts"],
      // pino-pretty: Used at runtime via dynamic require
      // web-push: Used in routes
      ignoreDependencies: [
        "pino-pretty",
        "web-push",
        "execa",
        "@types/web-push",
      ],
    },
    "apps/web": {
      entry: [
        "src/server.ts",
        "src/index.tsx",
        "tests/**/*.test.{ts,tsx}",
        "tests/setup.ts",
      ],
      project: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
      // bun-plugin-tailwind: Referenced in bunfig.toml, not importable code
      ignoreDependencies: ["bun-plugin-tailwind"],
      ignoreBinaries: ["dist/server.js"],
    },
    "packages/shared": {
      project: ["src/**/*.ts"],
    },
    "packages/cli": {
      entry: ["tests/**/*.test.ts"],
      project: ["src/**/*.ts", "tests/**/*.ts"],
      // Agent dependencies bundled into CLI
      ignoreDependencies: [
        "pino",
        "pino-pretty",
        "web-push",
        "fs-extra",
        "@types/fs-extra",
        "@types/web-push",
      ],
    },
  },
  ignoreExportsUsedInFile: true,
  ignoreDependencies: ["husky", "lint-staged"],
};

export default config;
