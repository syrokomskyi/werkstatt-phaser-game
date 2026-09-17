/*
<MODULE_CONTRACT>
<purpose>phaser.typescript.validate — PHASER-05 TypeScript-first enforcement for game source code files.</purpose>


<non-goals>
  <item>Does not modify files — read-only validator.</item>
  <item>Does not run tsc — regex-based source scanning only.</item>
  <item>Does not check the game config file outside project root.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1100: rewritten as pure checkTypeScript() on shared seams — walkFiles/readTextFiles for source discovery, readPhaserConfig model for the GameConfig type check; command envelope moved to PHASER_CHECKS spec.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
  <item>RFC-1100: steps 3-6 — spec-driven checks, shared seams, scaffold table</item>
</CHANGE_SUMMARY>
*/

import { join } from "node:path";
import { readTextFiles, walkFiles } from "@warpgogol/werkstatt-shared/stack/walk-files";
import type { StackCheckViolation } from "@warpgogol/werkstatt-shared/stack/stack-checks";
import { readPhaserConfig } from "../config/phaser-config.ts";
import { PHASER_PATHS } from "../paths/phaser-paths.ts";

export async function checkTypeScript(projectRoot: string): Promise<StackCheckViolation[]> {
  const violations: StackCheckViolation[] = [];
  const srcDir = join(projectRoot, PHASER_PATHS.srcDir);

  const srcFiles = await walkFiles(srcDir, {
    filter: (rel) => rel.endsWith(".ts") && !rel.endsWith(".d.ts"),
  });
  const contents = await readTextFiles(srcDir, srcFiles);

  for (const relPath of srcFiles) {
    const content = contents.get(relPath);
    if (content === undefined) continue;
    const relFile = `${PHASER_PATHS.srcDir}/${relPath}`;
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

  const jsFiles = await walkFiles(srcDir, {
    filter: (rel) => rel.endsWith(".js"),
  });
  for (const relPath of jsFiles) {
    violations.push({
      ruleId: "PHASER-05",
      file: `${PHASER_PATHS.srcDir}/${relPath}`,
      line: 1,
      message: "JavaScript file detected — use .ts extension only (TS-01)",
    });
  }

  const model = await readPhaserConfig(projectRoot);
  if (model.raw !== "" && !model.usesGameConfigType) {
    violations.push({
      ruleId: "PHASER-05",
      file: PHASER_PATHS.phaserConfig,
      line: 1,
      message: "Custom game config interface — use Phaser.Types.Core.GameConfig (TS-04)",
    });
  }

  return violations;
}

function isComment(trimmed: string): boolean {
  return trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
}

function checkAnyType(
  line: string,
  file: string,
  lineNum: number,
  violations: StackCheckViolation[],
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
  violations: StackCheckViolation[],
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
  violations: StackCheckViolation[],
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
  violations: StackCheckViolation[],
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
