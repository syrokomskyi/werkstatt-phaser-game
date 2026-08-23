/*
<MODULE_CONTRACT>
<purpose>phaser.typescript.validate — PHASER-05 TypeScript-first enforcement.</purpose>
<keywords>validator, typescript, phaser, best-practices</keywords>
<responsibilities>
  <item>TS-01: No .js files in src/.</item>
  <item>TS-02: No 'any' type or 'as any' cast in source.</item>
  <item>TS-03: No @ts-ignore or @ts-nocheck directives.</item>
  <item>TS-04: phaser.config.ts must use Phaser.Types.Core.GameConfig, not a custom interface.</item>
  <item>TS-05: Scene keys in super({ key: "..." }) must reference SCENE_KEYS constant.</item>
  <item>TS-06: Files using Phaser. namespace must import Phaser.</item>
</responsibilities>
<non-goals>
  <item>Does not modify files — read-only validator.</item>
  <item>Does not run tsc — regex-based source scanning only.</item>
  <item>Does not check phaser.config.ts outside project root.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial TypeScript-first validator — 6 sub-rules (TS-01..06) enforcing PHASER-05 (RFC-0933).</item>
</CHANGE_SUMMARY>
*/

import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import type { Dirent } from "node:fs";
import type {
  KernelCommandDefinition,
  KernelCommandResult,
} from "@warpgogol/werkstatt/kernel/types";

export interface TypeScriptValidateViolation {
  ruleId: string;
  file: string;
  line: number;
  message: string;
}

export interface TypeScriptValidateData {
  command: string;
  status: "pass" | "fail";
  violations: TypeScriptValidateViolation[];
}

const SRC_DIR = "src";
const PHASER_CONFIG = "phaser.config.ts";

export async function validateTypeScript(
  projectRoot: string,
): Promise<KernelCommandResult<TypeScriptValidateData>> {
  const violations: TypeScriptValidateViolation[] = [];
  const srcPath = join(projectRoot, SRC_DIR);

  const srcFiles = await listSourceFiles(srcPath);
  for (const filePath of srcFiles) {
    const relFile = relative(projectRoot, filePath);
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();

      if (isComment(trimmed)) {
        checkTsSuppression(line, relFile, i + 1, violations);
        continue;
      }

      checkTsSuppression(line, relFile, i + 1, violations);
      checkAnyType(line, relFile, i + 1, violations);
      checkHardcodedSceneKey(line, relFile, i + 1, violations);
      checkMissingPhaserImport(line, content, relFile, i + 1, violations);
    }
  }

  const jsFiles = await listJsFiles(srcPath);
  for (const filePath of jsFiles) {
    const relFile = relative(projectRoot, filePath);
    violations.push({
      ruleId: "PHASER-05",
      file: relFile,
      line: 1,
      message: "JavaScript file detected — use .ts extension only (TS-01)",
    });
  }

  await checkConfigInterface(projectRoot, violations);

  const status = violations.length === 0 ? "pass" : "fail";
  return {
    data: { command: "phaser.typescript.validate", status, violations },
    exitCode: status === "pass" ? 0 : 1,
    summary: `phaser.typescript.validate: ${status} (${violations.length} violations)`,
  };
}

function isComment(trimmed: string): boolean {
  return trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
}

function checkAnyType(
  line: string,
  file: string,
  lineNum: number,
  violations: TypeScriptValidateViolation[],
): void {
  if (/\b:\s*any\b/.test(line) || /\bas\s+any\b/.test(line)) {
    violations.push({
      ruleId: "PHASER-05",
      file,
      line: lineNum,
      message: "Use of 'any' type — use explicit Phaser types or 'unknown' (TS-02)",
    });
  }
}

function checkTsSuppression(
  line: string,
  file: string,
  lineNum: number,
  violations: TypeScriptValidateViolation[],
): void {
  if (/@ts-ignore|@ts-nocheck|@ts-expect-error/.test(line)) {
    violations.push({
      ruleId: "PHASER-05",
      file,
      line: lineNum,
      message: "TypeScript suppression directive — fix the type error instead (TS-03)",
    });
  }
}

function checkHardcodedSceneKey(
  line: string,
  file: string,
  lineNum: number,
  violations: TypeScriptValidateViolation[],
): void {
  const hardcodedKeyRegex = /super\s*\(\s*\{\s*key\s*:\s*["']/;
  if (hardcodedKeyRegex.test(line) && !line.includes("SCENE_KEYS")) {
    violations.push({
      ruleId: "PHASER-05",
      file,
      line: lineNum,
      message: "Hardcoded scene key — use SCENE_KEYS constant (TS-05)",
    });
  }
}

function checkMissingPhaserImport(
  line: string,
  fullContent: string,
  file: string,
  lineNum: number,
  violations: TypeScriptValidateViolation[],
): void {
  if (!line.includes("Phaser.")) return;

  const hasImport =
    /^import\s+(?:type\s+)?Phaser\b/m.test(fullContent) ||
    /^import\s+(?:type\s+)?\{[^}]*\bPhaser\b[^}]*\}\s+from\s+["']phaser["']/m.test(fullContent);
  if (!hasImport) {
    violations.push({
      ruleId: "PHASER-05",
      file,
      line: lineNum,
      message: "Missing Phaser import — add 'import Phaser from \"phaser\"' (TS-06)",
    });
  }
}

async function checkConfigInterface(
  projectRoot: string,
  violations: TypeScriptValidateViolation[],
): Promise<void> {
  const configPath = join(projectRoot, PHASER_CONFIG);
  let content: string;
  try {
    content = await readFile(configPath, "utf-8");
  } catch {
    return;
  }

  if (!content.includes("Phaser.Types.Core.GameConfig")) {
    violations.push({
      ruleId: "PHASER-05",
      file: PHASER_CONFIG,
      line: 1,
      message: "Custom game config interface — use Phaser.Types.Core.GameConfig (TS-04)",
    });
  }
}

async function listSourceFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listSourceFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      results.push(fullPath);
    }
  }
  return results;
}

async function listJsFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listJsFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".js") && !entry.name.endsWith(".d.ts")) {
      results.push(fullPath);
    }
  }
  return results;
}

export function createTypeScriptValidateCommand(): KernelCommandDefinition<TypeScriptValidateData> {
  return {
    name: "phaser.typescript.validate",
    description: "Validate TypeScript-first best practices (PHASER-05)",
    scope: "workspace",
    cacheable: false,
    async execute(_input, context) {
      return validateTypeScript(context.workspaceRoot);
    },
  };
}
