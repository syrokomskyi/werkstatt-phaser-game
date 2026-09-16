/*
<MODULE_CONTRACT>
<purpose>phaser.bundle.validate — measures the gzipped bundle size against the configured budget (PHASER-03).</purpose>

<non-goals>
  <item>Does not modify files — read-only validator.</item>
  <item>Does not run the build — measures existing dist/ output only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1100: rewritten as pure checkBundle() on shared seams — walkFiles/readBinaryFiles for dist measurement, readPhaserConfig model for bundleBudget; byte counts ride in violation details; command envelope moved to PHASER_CHECKS spec.</item>
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
import { gzipSync } from "node:zlib";
import { readBinaryFiles, walkFiles } from "@warpgogol/werkstatt-shared/share/walk-files";
import type { StackCheckViolation } from "@warpgogol/werkstatt-shared/share/stack-checks";
import { readPhaserConfig } from "../config/phaser-config.ts";
import { PHASER_PATHS } from "../paths/phaser-paths.ts";

export const DEFAULT_BUNDLE_BUDGET = 5 * 1024 * 1024;

export async function checkBundle(projectRoot: string): Promise<StackCheckViolation[]> {
  const model = await readPhaserConfig(projectRoot);
  const budget = model.bundleBudget ?? DEFAULT_BUNDLE_BUDGET;

  const distDir = join(projectRoot, PHASER_PATHS.distDir);
  const files = await walkFiles(distDir);
  const contents = await readBinaryFiles(distDir, files);

  let bundleBytes = 0;
  for (const content of contents.values()) {
    if (content.length === 0) continue;
    bundleBytes += gzipSync(content).length;
  }

  if (bundleBytes <= budget) {
    return [];
  }

  return [
    {
      ruleId: "PHASER-03",
      file: PHASER_PATHS.distDir,
      message: `Bundle exceeds budget: ${bundleBytes} bytes > ${budget} bytes (${formatMB(bundleBytes)} > ${formatMB(budget)} MB gzipped)`,
      details: { bundleBytes, budgetBytes: budget },
    },
  ];
}

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2);
}
