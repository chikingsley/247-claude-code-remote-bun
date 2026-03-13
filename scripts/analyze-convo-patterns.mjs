#!/usr/bin/env node

import { createReadStream, existsSync, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAYS = 365;
const DEFAULT_OUTPUT_DIR = process.cwd();

const FAILURE_SCORING_RULES = [
  {
    weight: 3,
    regex:
      /\b(not working|not work|does(?:n'?t| not) work|won'?t work|broken|breaks)\b/i,
  },
  {
    weight: 2,
    regex: /\b(fail(?:ing|ed|s)?|failure|error|exception|crash|bug)\b/i,
  },
  {
    weight: 2,
    regex:
      /\b(stuck|blocked|frustrat(?:ed|ing|ion)?|annoy(?:ing|ed)|pain(?:point)?|horrible|mess|shitty|wtf)\b/i,
  },
  {
    weight: 1.5,
    regex:
      /\b(don'?t understand|do not understand|confusing|unclear|how does|what does|supposed to)\b/i,
  },
  {
    weight: 1.5,
    regex: /\b(systemic|existential|fundamental|deep|legacy|codebase)\b/i,
  },
  {
    weight: 1,
    regex: /\b(still|again|keeps|same issue|again and again)\b/i,
  },
  {
    weight: 0.75,
    regex: /\b(issue|problem)\b/i,
  },
];

const ROOT_RULES = [
  {
    type: "auth_permissions",
    regex:
      /\b(auth|oauth|token|credential|permission|forbidden|unauthorized|401|403|api key|apikey|secret)\b/i,
  },
  {
    type: "env_config_drift",
    regex:
      /\b(env|dotenv|config|setting|setup|install|dependency|version|node_modules|runtime|mismatch|drift|path)\b/i,
  },
  {
    type: "data_state_mismatch",
    regex:
      /\b(sync|backfill|migration|schema|database|sqlite|postgres|duplicate|stale|cache|state|seed|upsert|index)\b/i,
  },
  {
    type: "tooling_pipeline",
    regex:
      /\b(ci|github actions|build|compile|typecheck|lint|test|vitest|jest|tsc|pipeline|turbo)\b/i,
  },
  {
    type: "unclear_ownership_or_requirements",
    regex:
      /\b(what does|how does|supposed to|unclear|confusing|not sure|don't know|owner|ownership|which file|where is)\b/i,
  },
  {
    type: "architecture_complexity",
    regex:
      /\b(systemic|architecture|architectural|legacy|refactor|coupled|spaghetti|fundamental|existential|deep codebase)\b/i,
  },
];

const ROOT_LABELS = {
  auth_permissions: "Auth / Permissions",
  env_config_drift: "Env / Config Drift",
  data_state_mismatch: "Data / State Mismatch",
  tooling_pipeline: "Tooling / Pipeline",
  unclear_ownership_or_requirements: "Unclear Ownership / Requirements",
  architecture_complexity: "Architecture Complexity",
  runtime_bug: "Runtime Bug",
};

const CHECKLIST_ITEMS = {
  auth_permissions: [
    "Validate API keys/tokens and required scopes before coding.",
    "Run a single auth probe command first and save the exact response.",
  ],
  env_config_drift: [
    "Confirm runtime versions (`node`, `bun`, package manager) match project expectations.",
    "Verify `.env` completeness against a canonical template before first run.",
  ],
  data_state_mismatch: [
    "Check migration/backfill status and confirm schema version before debugging app logic.",
    "Capture one known-good record path end-to-end before broad refactors.",
  ],
  tooling_pipeline: [
    "Run local build/lint/test once before starting deep implementation.",
    "When CI fails, reproduce with the exact failing command and flags locally first.",
  ],
  unclear_ownership_or_requirements: [
    "Write a 3-line task contract: expected behavior, source of truth file, completion check.",
    "Identify owner modules/files before editing implementation details.",
  ],
  architecture_complexity: [
    "Map the request path and data flow first (entrypoint -> transform -> storage -> output).",
    "If the same confusion loops twice, pause and write a mini architecture note before more edits.",
  ],
  runtime_bug: [
    "Capture exact repro steps and full error text before changing code.",
    "Make one minimal, reversible fix at a time and re-test immediately.",
  ],
};

const GENERIC_GUARDRAILS = [
  "If the same issue appears 3 times in one session, stop and write a short root-cause note.",
  "End each session with one sentence: what fixed it or what is still unknown.",
  "Keep a running list of known-good commands to avoid re-learning setup state.",
];

function parseArgs(argv) {
  const options = {
    focus: "",
    days: DEFAULT_DAYS,
    outputDir: DEFAULT_OUTPUT_DIR,
    maxFiles: 0,
    codexHome: process.env.CODEX_HOME || path.join(os.homedir(), ".codex"),
    claudeHome: process.env.CLAUDE_HOME || path.join(os.homedir(), ".claude"),
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--focus") {
      options.focus = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (arg.startsWith("--focus=")) {
      options.focus = arg.split("=").slice(1).join("=");
      continue;
    }
    if (arg === "--days") {
      options.days = Math.max(0, Number.parseInt(argv[i + 1] ?? "", 10) || 0);
      i += 1;
      continue;
    }
    if (arg.startsWith("--days=")) {
      options.days = Math.max(
        0,
        Number.parseInt(arg.split("=").slice(1).join("="), 10) || 0
      );
      continue;
    }
    if (arg === "--output-dir") {
      options.outputDir = expandHome(argv[i + 1] ?? DEFAULT_OUTPUT_DIR);
      i += 1;
      continue;
    }
    if (arg.startsWith("--output-dir=")) {
      options.outputDir = expandHome(arg.split("=").slice(1).join("="));
      continue;
    }
    if (arg === "--max-files") {
      options.maxFiles = Math.max(
        0,
        Number.parseInt(argv[i + 1] ?? "", 10) || 0
      );
      i += 1;
      continue;
    }
    if (arg.startsWith("--max-files=")) {
      options.maxFiles = Math.max(
        0,
        Number.parseInt(arg.split("=").slice(1).join("="), 10) || 0
      );
      continue;
    }
    if (arg === "--codex-home") {
      options.codexHome = expandHome(argv[i + 1] ?? options.codexHome);
      i += 1;
      continue;
    }
    if (arg.startsWith("--codex-home=")) {
      options.codexHome = expandHome(arg.split("=").slice(1).join("="));
      continue;
    }
    if (arg === "--claude-home") {
      options.claudeHome = expandHome(argv[i + 1] ?? options.claudeHome);
      i += 1;
      continue;
    }
    if (arg.startsWith("--claude-home=")) {
      options.claudeHome = expandHome(arg.split("=").slice(1).join("="));
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/analyze-convo-patterns.mjs [options]

Options:
  --focus <text>        Focus on project/path/text match (e.g., desert-services-hub)
  --days <n>            Look back n days by file mtime (0 = all files)
  --output-dir <path>   Output directory (default: current directory)
  --max-files <n>       Keep only newest n files after discovery (0 = all)
  --codex-home <path>   Override Codex home directory
  --claude-home <path>  Override Claude home directory
  --help                Show this help
`);
}

function expandHome(inputPath) {
  if (!inputPath) {
    return inputPath;
  }
  if (inputPath === "~") {
    return os.homedir();
  }
  if (inputPath.startsWith("~/")) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}

function escapeForCsv(value) {
  const str = String(value ?? "");
  return `"${str.replaceAll('"', '""')}"`;
}

function shortProjectName(projectPath) {
  if (!projectPath || projectPath === "unknown") {
    return "unknown";
  }
  const normalized = projectPath.replace(/\/+$/g, "");
  if (!normalized) {
    return "unknown";
  }
  return normalized.split("/").at(-1) || normalized;
}

function cleanText(raw) {
  if (typeof raw !== "string") {
    return "";
  }
  let text = raw;
  text = text.replace(
    /<local-command-caveat>[\s\S]*?<\/local-command-caveat>/gi,
    " "
  );
  text = text.replace(
    /<local-command-stdout>[\s\S]*?<\/local-command-stdout>/gi,
    " "
  );
  text = text.replace(/<command-[^>]+>[\s\S]*?<\/command-[^>]+>/gi, " ");
  text = text.replace(/\[Pasted text #[0-9]+\]/gi, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  if (text.length < 4) {
    return "";
  }
  return text;
}

function shouldSkipMessage(text) {
  if (!text) {
    return true;
  }
  if (/^#?\s*AGENTS\.md instructions for /i.test(text)) {
    return true;
  }
  if (/<environment_context>/i.test(text)) {
    return true;
  }
  if (
    /^\s*you are an expert in .*mcp tools/i.test(text) ||
    /^\s*you are codex[, ]/i.test(text)
  ) {
    return true;
  }
  if (
    /^this session is being continued from a previous conversation/i.test(text)
  ) {
    return true;
  }
  if (/^your task is to create a detailed summary of/i.test(text)) {
    return true;
  }
  if (/^codex desktop context/i.test(text)) {
    return true;
  }
  if (/^#\s*codex desktop context/i.test(text)) {
    return true;
  }
  if (/previously using a different model/i.test(text)) {
    return true;
  }
  if (/ran insights to generate a usage report/i.test(text)) {
    return true;
  }
  if (/(^|\s)\/insights(\s|$)/i.test(text)) {
    return true;
  }
  if (
    /please continue the conversation according to the following instructions/i.test(
      text
    ) &&
    /you are codex, a coding agent/i.test(text)
  ) {
    return true;
  }
  if (/^this is a context summary from a previous conversation/i.test(text)) {
    return true;
  }
  if ((text.match(/→/g) || []).length >= 6) {
    return true;
  }
  if (/^\s*\d+→/.test(text)) {
    return true;
  }
  if (
    /(?:^|\s)import\s+.+\s+from\s+["'][^"']+["']/.test(text) &&
    text.length > 120
  ) {
    return true;
  }
  return false;
}

function parseTimestamp(raw) {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw === "number") {
    if (raw > 1_000_000_000_000) {
      return raw;
    }
    if (raw > 1_000_000_000) {
      return raw * 1000;
    }
    return null;
  }
  if (typeof raw === "string") {
    const asNum = Number(raw);
    if (!Number.isNaN(asNum)) {
      return parseTimestamp(asNum);
    }
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

function contentToText(content) {
  if (!content) {
    return "";
  }
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => contentToText(item))
      .filter(Boolean)
      .join("\n");
  }
  if (typeof content === "object") {
    if (["tool_use", "tool_result"].includes(content.type)) {
      return "";
    }
    if (typeof content.text === "string") {
      return content.text;
    }
    if (
      ["text", "input_text", "output_text"].includes(content.type) &&
      typeof content.text === "string"
    ) {
      return content.text;
    }
    if (typeof content.content === "string") {
      return content.content;
    }
    if (Array.isArray(content.content)) {
      return contentToText(content.content);
    }
  }
  return "";
}

function evaluateFailure(text) {
  let score = 0;
  let matches = 0;
  for (const rule of FAILURE_SCORING_RULES) {
    if (rule.regex.test(text)) {
      score += rule.weight;
      matches += 1;
    }
  }
  if (
    /\b(error:|typeerror|referenceerror|enoent|eacces|timeout)\b/i.test(text)
  ) {
    score += 2;
    matches += 1;
  }
  const hasStrongSignal =
    /\b(not working|does(?:n'?t| not) work|won'?t work|broken|breaks|fail(?:ing|ed|s)?|failure|error|exception|crash|bug|stuck|blocked|frustrat(?:ed|ing|ion)?|pain(?:point)?|horrible|wtf)\b/i.test(
      text
    );
  const intense =
    /\b(fucking|horrible|stupid|existential|systemic|frustrat(?:ed|ing|ion)?|painpoint)\b/i.test(
      text
    );
  return { score, matches, intense, hasStrongSignal };
}

function classifyRootCause(text) {
  for (const rule of ROOT_RULES) {
    if (rule.regex.test(text)) {
      return rule.type;
    }
  }
  return "runtime_bug";
}

function calcConfidence(failureScore, rootCause) {
  let confidence = 0.45 + Math.min(6, failureScore) * 0.07;
  if (rootCause !== "runtime_bug") {
    confidence += 0.1;
  }
  return Number(Math.min(0.95, confidence).toFixed(2));
}

function symptomSignature(symptom) {
  return symptom
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|and|for|with|this|that|from|into|about|just|like)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 9)
    .join(" ");
}

function extractFixCandidate(text) {
  const cleaned = cleanText(text);
  if (!cleaned || cleaned.length < 20) {
    return "";
  }
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  for (const sentence of sentences) {
    if (
      /^(let me|i('|’)ll|i will|checking|looking|working on|i'm going to|i am going to|i hear you)\b/i.test(
        sentence
      )
    ) {
      continue;
    }
    if (
      /\b(fix|run|change|update|remove|add|set|use|check|confirm|migrate|rename|resolved|solution|root cause|issue was|problem was)\b/i.test(
        sentence
      )
    ) {
      return sentence.slice(0, 220);
    }
  }
  return "";
}

function matchesFocus(options, project, text) {
  if (!options.focus) {
    return true;
  }
  const focus = options.focus.toLowerCase();
  return (
    (project && project.toLowerCase().includes(focus)) ||
    (text && text.toLowerCase().includes(focus))
  );
}

function inferSessionHint(filePath) {
  const base = path.basename(filePath);
  const match = base.match(
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
  );
  return match?.[1] ?? base.replace(/\.jsonl$/i, "");
}

function parseLineToEvents(sourceType, lineObj, sessionHint) {
  const events = [];
  if (!lineObj || typeof lineObj !== "object") {
    return events;
  }

  if (sourceType === "codex_history") {
    if (typeof lineObj.text === "string") {
      events.push({
        kind: "message",
        source: sourceType,
        role: "user",
        sessionId: lineObj.session_id || sessionHint,
        project: "",
        timestampMs: parseTimestamp(lineObj.ts),
        text: lineObj.text,
      });
    }
    return events;
  }

  if (sourceType === "claude_history") {
    if (typeof lineObj.display === "string") {
      events.push({
        kind: "message",
        source: sourceType,
        role: "user",
        sessionId: lineObj.sessionId || sessionHint,
        project: lineObj.project || "",
        timestampMs: parseTimestamp(lineObj.timestamp),
        text: lineObj.display,
      });
    }
    return events;
  }

  if (sourceType === "codex_archived") {
    if (lineObj.type === "session_meta") {
      events.push({
        kind: "meta",
        source: sourceType,
        sessionId: lineObj.payload?.id || sessionHint,
        project: lineObj.payload?.cwd || "",
        timestampMs: parseTimestamp(
          lineObj.timestamp || lineObj.payload?.timestamp
        ),
      });
      return events;
    }
    if (lineObj.type === "turn_context") {
      events.push({
        kind: "meta",
        source: sourceType,
        sessionId: sessionHint,
        project: lineObj.payload?.cwd || "",
        timestampMs: parseTimestamp(lineObj.timestamp),
      });
      return events;
    }
    if (
      lineObj.type === "response_item" &&
      lineObj.payload?.type === "message"
    ) {
      events.push({
        kind: "message",
        source: sourceType,
        role: lineObj.payload.role || "user",
        sessionId: sessionHint,
        project: "",
        timestampMs: parseTimestamp(lineObj.timestamp),
        text: contentToText(lineObj.payload.content),
      });
      return events;
    }
    if (lineObj.type === "event_msg") {
      const messageType = lineObj.payload?.type;
      if (!["user_message", "assistant_message"].includes(messageType)) {
        return events;
      }
      const role = messageType === "assistant_message" ? "assistant" : "user";
      const eventText =
        lineObj.payload?.message || contentToText(lineObj.payload);
      if (eventText) {
        events.push({
          kind: "message",
          source: sourceType,
          role,
          sessionId: sessionHint,
          project: "",
          timestampMs: parseTimestamp(lineObj.timestamp),
          text: eventText,
        });
      }
      return events;
    }
    return events;
  }

  if (sourceType === "claude_projects") {
    const sessionId = lineObj.sessionId || sessionHint;
    const project = lineObj.cwd || "";
    const timestampMs = parseTimestamp(lineObj.timestamp);

    if (project) {
      events.push({
        kind: "meta",
        source: sourceType,
        sessionId,
        project,
        timestampMs,
      });
    }

    if (lineObj.type === "user" && lineObj.message?.role === "user") {
      events.push({
        kind: "message",
        source: sourceType,
        role: "user",
        sessionId,
        project,
        timestampMs,
        text: contentToText(lineObj.message?.content),
      });
      return events;
    }

    if (lineObj.type === "assistant" && lineObj.message?.role === "assistant") {
      events.push({
        kind: "message",
        source: sourceType,
        role: "assistant",
        sessionId,
        project,
        timestampMs,
        text: contentToText(lineObj.message?.content),
      });
      return events;
    }
  }

  return events;
}

async function listJsonlFiles(rootDir, sourceType, maxDepth, cutoffMs) {
  const results = [];
  if (!existsSync(rootDir)) {
    return results;
  }

  const stack = [{ dir: rootDir, depth: 0 }];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    let entries = [];
    try {
      entries = await fs.readdir(current.dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current.dir, entry.name);
      if (entry.isDirectory()) {
        if (current.depth < maxDepth) {
          stack.push({ dir: fullPath, depth: current.depth + 1 });
        }
        continue;
      }
      if (!(entry.isFile() && entry.name.endsWith(".jsonl"))) {
        continue;
      }
      let stat = null;
      try {
        stat = await fs.stat(fullPath);
      } catch {
        continue;
      }
      if (cutoffMs > 0 && stat.mtimeMs < cutoffMs) {
        continue;
      }
      results.push({
        path: fullPath,
        sourceType,
        sizeBytes: stat.size,
        mtimeMs: stat.mtimeMs,
      });
    }
  }

  return results;
}

async function collectSourceFiles(options) {
  const cutoffMs = options.days > 0 ? Date.now() - options.days * DAY_MS : 0;
  const allFiles = [];

  const codexHistory = path.join(options.codexHome, "history.jsonl");
  if (existsSync(codexHistory)) {
    const stat = await fs.stat(codexHistory);
    if (cutoffMs === 0 || stat.mtimeMs >= cutoffMs) {
      allFiles.push({
        path: codexHistory,
        sourceType: "codex_history",
        sizeBytes: stat.size,
        mtimeMs: stat.mtimeMs,
      });
    }
  }

  const codexArchived = await listJsonlFiles(
    path.join(options.codexHome, "archived_sessions"),
    "codex_archived",
    1,
    cutoffMs
  );
  allFiles.push(...codexArchived);

  const claudeHistory = path.join(options.claudeHome, "history.jsonl");
  if (existsSync(claudeHistory)) {
    const stat = await fs.stat(claudeHistory);
    if (cutoffMs === 0 || stat.mtimeMs >= cutoffMs) {
      allFiles.push({
        path: claudeHistory,
        sourceType: "claude_history",
        sizeBytes: stat.size,
        mtimeMs: stat.mtimeMs,
      });
    }
  }

  const claudeProjects = await listJsonlFiles(
    path.join(options.claudeHome, "projects"),
    "claude_projects",
    6,
    cutoffMs
  );
  allFiles.push(...claudeProjects);

  allFiles.sort((a, b) => a.mtimeMs - b.mtimeMs);
  if (options.maxFiles > 0 && allFiles.length > options.maxFiles) {
    return allFiles.slice(-options.maxFiles);
  }
  return allFiles;
}

function ensureSessionState(sessionStateByKey, key) {
  if (!sessionStateByKey.has(key)) {
    sessionStateByKey.set(key, {
      project: "unknown",
      pendingEpisodeIndex: null,
      lastEpisodeSig: "",
      lastEpisodeTs: 0,
    });
  }
  return sessionStateByKey.get(key);
}

function sessionKeyForEvent(event) {
  const source = event.source || "unknown_source";
  const sessionId = event.sessionId || "unknown_session";
  return `${source}:${sessionId}`;
}

function estimateTimeLostMinutes(episode, loopCountForKey) {
  let minutes = 15 + Math.round(episode._score * 6);
  if (episode._intense) {
    minutes += 12;
  }
  if (episode.root_cause_type === "architecture_complexity") {
    minutes += 15;
  }
  if (loopCountForKey > 1) {
    minutes += Math.min(24, (loopCountForKey - 1) * 3);
  }
  return minutes;
}

function buildPreflightChecklist(episodes, options) {
  const byRoot = new Map();
  for (const episode of episodes) {
    const current = byRoot.get(episode.root_cause_type) || 0;
    byRoot.set(episode.root_cause_type, current + 1);
  }

  const rankedRoots = [...byRoot.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([root]) => root);

  const lines = [];
  lines.push("# Preflight Checklist");
  lines.push("");
  lines.push(
    "Use this checklist before deep sessions to reduce repeated failure loops."
  );
  lines.push("");
  if (options.focus) {
    lines.push(`Focus context: \`${options.focus}\``);
    lines.push("");
  }
  lines.push("## Priority Checks");
  lines.push("");

  for (const root of rankedRoots) {
    lines.push(`### ${ROOT_LABELS[root] || root}`);
    const items = CHECKLIST_ITEMS[root] || CHECKLIST_ITEMS.runtime_bug;
    for (const item of items.slice(0, 2)) {
      lines.push(`- [ ] ${item}`);
    }
    lines.push("");
  }

  lines.push("## Session Guardrails");
  lines.push("");
  for (const guardrail of GENERIC_GUARDRAILS) {
    lines.push(`- [ ] ${guardrail}`);
  }
  lines.push("");

  return `${lines.join("\n").trim()}\n`;
}

function buildTopFailureLoopsReport(episodes, filesScanned, stats, options) {
  const rootStats = new Map();
  const projectStats = new Map();
  const symptomStats = new Map();

  let totalMinutes = 0;
  for (const episode of episodes) {
    totalMinutes += episode.time_lost_minutes;

    const rootCurrent = rootStats.get(episode.root_cause_type) || {
      count: 0,
      minutes: 0,
    };
    rootCurrent.count += 1;
    rootCurrent.minutes += episode.time_lost_minutes;
    rootStats.set(episode.root_cause_type, rootCurrent);

    const projectKey = shortProjectName(episode.project);
    const projectCurrent = projectStats.get(projectKey) || {
      count: 0,
      minutes: 0,
    };
    projectCurrent.count += 1;
    projectCurrent.minutes += episode.time_lost_minutes;
    projectStats.set(projectKey, projectCurrent);

    const sig = symptomSignature(episode.symptom);
    if (sig) {
      symptomStats.set(sig, (symptomStats.get(sig) || 0) + 1);
    }
  }

  const rankedRoots = [...rootStats.entries()].sort(
    (a, b) => b[1].count - a[1].count
  );
  const rankedProjects = [...projectStats.entries()].sort(
    (a, b) => b[1].count - a[1].count
  );
  const rankedSymptoms = [...symptomStats.entries()].sort(
    (a, b) => b[1] - a[1]
  );

  const lines = [];
  lines.push("# Top Failure Loops");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Focus: ${options.focus || "all projects"}`);
  lines.push(`Window: last ${options.days > 0 ? options.days : "all"} days`);
  lines.push("");
  lines.push("## Coverage");
  lines.push("");
  lines.push(`- Files scanned: ${filesScanned}`);
  lines.push(`- Lines parsed: ${stats.linesParsed}`);
  lines.push(`- Messages considered: ${stats.messagesConsidered}`);
  lines.push(`- Failure episodes captured: ${episodes.length}`);
  lines.push(`- Estimated time lost: ${(totalMinutes / 60).toFixed(1)} hours`);
  lines.push("");
  lines.push("## Root Causes");
  lines.push("");
  lines.push("| Root Cause | Episodes | Est. Time Lost (hrs) | Share |");
  lines.push("|---|---:|---:|---:|");
  for (const [root, values] of rankedRoots) {
    const share = episodes.length
      ? `${((values.count / episodes.length) * 100).toFixed(1)}%`
      : "0.0%";
    lines.push(
      `| ${ROOT_LABELS[root] || root} | ${values.count} | ${(
        values.minutes / 60
      ).toFixed(1)} | ${share} |`
    );
  }
  lines.push("");
  lines.push("## Project Hotspots");
  lines.push("");
  lines.push("| Project | Episodes | Est. Time Lost (hrs) |");
  lines.push("|---|---:|---:|");
  for (const [project, values] of rankedProjects.slice(0, 12)) {
    lines.push(
      `| ${project.replaceAll("|", "\\|")} | ${values.count} | ${(
        values.minutes / 60
      ).toFixed(1)} |`
    );
  }
  lines.push("");
  const repeatedSymptoms = rankedSymptoms.filter(([, count]) => count > 1);
  lines.push("## Repeated Symptom Signatures");
  lines.push("");
  if (repeatedSymptoms.length === 0) {
    lines.push(
      "- No multi-occurrence symptom signatures after de-duplication."
    );
  } else {
    for (const [symptom, count] of repeatedSymptoms.slice(0, 12)) {
      lines.push(`- ${symptom} (${count})`);
    }
  }
  lines.push("");

  return `${lines.join("\n").trim()}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  await fs.mkdir(options.outputDir, { recursive: true });

  const files = await collectSourceFiles(options);
  const sessionStateByKey = new Map();
  const episodes = [];
  const stats = {
    linesParsed: 0,
    messagesConsidered: 0,
  };

  for (const file of files) {
    const sessionHint = inferSessionHint(file.path);
    const stream = createReadStream(file.path, { encoding: "utf8" });
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Number.POSITIVE_INFINITY,
    });

    for await (const line of rl) {
      stats.linesParsed += 1;
      if (!line || line.trim().length === 0) {
        continue;
      }
      let parsed = null;
      try {
        parsed = JSON.parse(line);
      } catch {
        continue;
      }

      const events = parseLineToEvents(file.sourceType, parsed, sessionHint);
      for (const event of events) {
        const key = sessionKeyForEvent(event);
        const state = ensureSessionState(sessionStateByKey, key);

        if (event.kind === "meta") {
          if (event.project) {
            state.project = event.project;
          }
          continue;
        }

        const rawText = cleanText(event.text);
        if (!rawText || shouldSkipMessage(rawText)) {
          continue;
        }
        stats.messagesConsidered += 1;

        const project = event.project || state.project || "unknown";
        const timestampMs = event.timestampMs || Date.now();

        if (event.role === "assistant") {
          if (
            state.pendingEpisodeIndex !== null &&
            state.pendingEpisodeIndex >= 0 &&
            state.pendingEpisodeIndex < episodes.length
          ) {
            const pending = episodes[state.pendingEpisodeIndex];
            const withinWindow =
              Math.abs(timestampMs - pending._ts) <= 3 * 60 * 60 * 1000;
            if (withinWindow) {
              const candidateFix = extractFixCandidate(rawText);
              if (candidateFix && !pending.fix) {
                pending.fix = candidateFix;
              }
            }
            state.pendingEpisodeIndex = null;
          }
          continue;
        }

        const lower = rawText.toLowerCase();
        if (
          state.pendingEpisodeIndex !== null &&
          /(works now|fixed now|resolved|all good|done now)/i.test(lower)
        ) {
          const pending = episodes[state.pendingEpisodeIndex];
          if (pending && !pending.fix) {
            pending.fix = "User reported issue resolved.";
          }
          state.pendingEpisodeIndex = null;
        }

        const failure = evaluateFailure(rawText);
        if (failure.score < 2.5 || !failure.hasStrongSignal) {
          continue;
        }

        if (!matchesFocus(options, project, rawText)) {
          continue;
        }

        const rootCause = classifyRootCause(rawText);
        const symptom = rawText.slice(0, 220);
        const sig = `${rootCause}:${symptomSignature(symptom)}`;

        const duplicateWithinWindow =
          state.lastEpisodeSig === sig &&
          timestampMs - state.lastEpisodeTs < 20 * 60 * 1000;
        if (duplicateWithinWindow) {
          continue;
        }

        const episode = {
          date: new Date(timestampMs).toISOString(),
          project: project || "unknown",
          symptom,
          root_cause_type: rootCause,
          time_lost_minutes: 0,
          fix: "",
          confidence: calcConfidence(failure.score, rootCause),
          source: file.sourceType,
          session_id: event.sessionId || sessionHint,
          _score: failure.score,
          _intense: failure.intense,
          _ts: timestampMs,
        };
        episodes.push(episode);
        state.pendingEpisodeIndex = episodes.length - 1;
        state.lastEpisodeSig = sig;
        state.lastEpisodeTs = timestampMs;
      }
    }
  }

  episodes.sort((a, b) => a._ts - b._ts);

  const dedupedEpisodes = [];
  const recentByKey = new Map();
  for (const episode of episodes) {
    const key = `${episode.session_id}|${episode.root_cause_type}|${symptomSignature(
      episode.symptom
    )}`;
    const previousTs = recentByKey.get(key);
    if (previousTs && Math.abs(episode._ts - previousTs) <= 15_000) {
      continue;
    }
    recentByKey.set(key, episode._ts);
    dedupedEpisodes.push(episode);
  }

  episodes.length = 0;
  episodes.push(...dedupedEpisodes);

  const loopCounts = new Map();
  for (const episode of episodes) {
    const key = `${shortProjectName(episode.project)}|${episode.root_cause_type}`;
    loopCounts.set(key, (loopCounts.get(key) || 0) + 1);
  }

  for (const episode of episodes) {
    const key = `${shortProjectName(episode.project)}|${episode.root_cause_type}`;
    const countForKey = loopCounts.get(key) || 1;
    episode.time_lost_minutes = estimateTimeLostMinutes(episode, countForKey);
    if (!episode.fix) {
      episode.fix = "No explicit fix captured in nearby assistant response.";
    }
  }

  const csvHeaders = [
    "date",
    "project",
    "symptom",
    "root_cause_type",
    "time_lost_minutes",
    "fix",
    "confidence",
    "source",
    "session_id",
  ];
  const csvRows = [csvHeaders.map((header) => escapeForCsv(header)).join(",")];
  for (const episode of episodes) {
    const row = [
      episode.date,
      episode.project,
      episode.symptom,
      episode.root_cause_type,
      episode.time_lost_minutes,
      episode.fix,
      episode.confidence,
      episode.source,
      episode.session_id,
    ];
    csvRows.push(row.map((value) => escapeForCsv(value)).join(","));
  }

  const patternsPath = path.join(options.outputDir, "patterns.csv");
  const loopsPath = path.join(options.outputDir, "top_failure_loops.md");
  const checklistPath = path.join(options.outputDir, "preflight_checklist.md");

  await fs.writeFile(patternsPath, `${csvRows.join("\n")}\n`, "utf8");
  await fs.writeFile(
    loopsPath,
    buildTopFailureLoopsReport(episodes, files.length, stats, options),
    "utf8"
  );
  await fs.writeFile(
    checklistPath,
    buildPreflightChecklist(episodes, options),
    "utf8"
  );

  console.log("Conversation pattern analysis complete.");
  console.log(`Focus: ${options.focus || "all projects"}`);
  console.log(`Files scanned: ${files.length}`);
  console.log(`Failure episodes captured: ${episodes.length}`);
  console.log(`Wrote: ${patternsPath}`);
  console.log(`Wrote: ${loopsPath}`);
  console.log(`Wrote: ${checklistPath}`);
}

main().catch((error) => {
  console.error("Analyzer failed:", error);
  process.exitCode = 1;
});
