/**
 * Thin wrapper around Bun.spawn for terminal creation.
 * Extracted so tests can mock it (Bun global is non-configurable).
 */
export function spawnPty(cmd: string[], opts?: any) {
  return Bun.spawn(cmd, opts);
}
