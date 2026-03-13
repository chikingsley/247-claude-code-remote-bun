#!/usr/bin/env bun
/**
 * Isolated test runner for bun:test
 *
 * Runs each test file in its own bun process to prevent
 * mock.module() contamination between files.
 */
import { Glob } from "bun";

const args = process.argv.slice(2);

// Determine which workspace to test based on cwd or args
const cwd = process.cwd();
const testDirs = args.length > 0 ? args : ["tests"];

// Find all test files
const testFiles: string[] = [];
for (const dir of testDirs) {
  const glob = new Glob(`${dir}/**/*.test.{ts,tsx}`);
  for (const file of glob.scanSync({ cwd })) {
    testFiles.push(file);
  }
}

if (testFiles.length === 0) {
  console.log("No test files found");
  process.exit(0);
}

let passed = 0;
let failed = 0;
let errors = 0;
const failedFiles: string[] = [];

// Run each test file in isolation
for (const file of testFiles.sort()) {
  const proc = Bun.spawnSync(["bun", "test", file], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  const stdout = proc.stdout.toString();
  const stderr = proc.stderr.toString();
  const output = stdout + stderr;

  // Parse results from output
  const passMatch = output.match(/(\d+) pass/);
  const failMatch = output.match(/(\d+) fail/);
  const errorMatch = output.match(/(\d+) error/);

  const filePassed = passMatch ? Number.parseInt(passMatch[1]) : 0;
  const fileFailed = failMatch ? Number.parseInt(failMatch[1]) : 0;
  const fileErrors = errorMatch ? Number.parseInt(errorMatch[1]) : 0;

  passed += filePassed;
  failed += fileFailed;
  errors += fileErrors;

  if (proc.exitCode !== 0) {
    failedFiles.push(file);
    console.log(`FAIL ${file} (${filePassed} pass, ${fileFailed} fail)`);
    // Show failure details
    const lines = output.split("\n");
    for (const line of lines) {
      if (
        line.includes("(fail)") ||
        line.includes("error:") ||
        line.includes("Error:")
      ) {
        console.log(`  ${line.trim()}`);
      }
    }
  } else {
    console.log(`PASS ${file} (${filePassed} pass)`);
  }
}

// Summary
console.log("\n---");
console.log(
  `${passed} pass, ${failed} fail, ${errors} error${errors !== 1 ? "s" : ""}`
);
console.log(`Ran ${passed + failed} tests across ${testFiles.length} files`);

if (failedFiles.length > 0) {
  console.log("\nFailed files:");
  for (const f of failedFiles) {
    console.log(`  ${f}`);
  }
  process.exit(1);
}
