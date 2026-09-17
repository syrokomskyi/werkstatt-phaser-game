/*
<MODULE_CONTRACT>
<purpose>phaser.assets.validate — checks asset manifest completeness for the game build (PHASER-02).</purpose>

<non-goals>
  <item>Does not modify files — read-only validator.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1100: rewritten as pure checkAssets() on shared seams — walkFiles for asset discovery, readTextFile for the manifest; command envelope moved to PHASER_CHECKS spec.</item>
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
import { parse as parseYaml } from "yaml";
import { readTextFile, walkFiles } from "@warpgogol/werkstatt-shared/stack/walk-files";
import type { StackCheckViolation } from "@warpgogol/werkstatt-shared/stack/stack-checks";
import { PHASER_PATHS } from "../paths/phaser-paths.ts";

export interface AssetManifestEntry {
  path: string;
  type?: string;
}

export interface AssetManifest {
  assets: AssetManifestEntry[];
}

const MANIFEST_FILENAME = "manifest.yaml";

export async function checkAssets(projectRoot: string): Promise<StackCheckViolation[]> {
  const violations: StackCheckViolation[] = [];

  let manifest: AssetManifest = { assets: [] };
  const raw = await readTextFile(join(projectRoot, PHASER_PATHS.assetManifest));
  if (raw !== null) {
    try {
      const parsed = parseYaml(raw) as AssetManifest | undefined;
      if (parsed && Array.isArray(parsed.assets)) {
        manifest = parsed;
      }
    } catch (parseErr) {
      const message = parseErr instanceof Error ? parseErr.message : String(parseErr);
      violations.push({
        ruleId: "PHASER-02",
        file: PHASER_PATHS.assetManifest,
        message: `Failed to parse asset manifest: ${message}`,
      });
    }
  }
  // Missing manifest = empty manifest (valid for freshly scaffolded projects)

  const assetFiles = new Set(await walkFiles(join(projectRoot, PHASER_PATHS.assetsDir)));

  for (const entry of manifest.assets) {
    if (!assetFiles.has(entry.path)) {
      violations.push({
        ruleId: "PHASER-02",
        file: `${PHASER_PATHS.assetsDir}/${entry.path}`,
        message: `Asset listed in manifest but not found on disk: ${entry.path}`,
      });
    }
  }

  const manifestPaths = new Set(manifest.assets.map((a) => a.path));
  for (const relPath of assetFiles) {
    if (relPath !== MANIFEST_FILENAME && !manifestPaths.has(relPath)) {
      violations.push({
        ruleId: "PHASER-02",
        file: `${PHASER_PATHS.assetsDir}/${relPath}`,
        message: `Asset file exists but is not listed in manifest: ${relPath}`,
      });
    }
  }

  return violations;
}
