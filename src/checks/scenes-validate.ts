/*
<MODULE_CONTRACT>
<purpose>phaser.scenes.validate — checks scene registry consistency across the game (PHASER-01).</purpose>

<non-goals>
  <item>Does not modify files — read-only validator.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1100: rewritten as pure checkScenes() on shared seams — walkFiles/readTextFiles for discovery, readPhaserConfig model for registration data; command envelope moved to PHASER_CHECKS spec.</item>
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

const SCENE_CLASS_PATTERN = /export\s+class\s+([A-Z][A-Za-z0-9_]*)/;

export async function checkScenes(projectRoot: string): Promise<StackCheckViolation[]> {
  const scenesDir = join(projectRoot, PHASER_PATHS.scenesDir);
  const sceneFiles = await walkFiles(scenesDir, {
    recursive: false,
    filter: (rel) => rel.endsWith(".ts") && !rel.endsWith(".d.ts"),
  });
  const contents = await readTextFiles(scenesDir, sceneFiles);
  const model = await readPhaserConfig(projectRoot);
  const registered = new Set(model.sceneKeys);

  const violations: StackCheckViolation[] = [];
  let sceneCount = 0;
  for (const fileName of sceneFiles) {
    const match = (contents.get(fileName) ?? "").match(SCENE_CLASS_PATTERN);
    if (!match) continue;
    sceneCount++;
    const className = match[1]!;
    if (!registered.has(className)) {
      violations.push({
        ruleId: "PHASER-01",
        file: `${PHASER_PATHS.scenesDir}/${fileName}`,
        message: `Scene class "${className}" not registered in ${PHASER_PATHS.phaserConfig}`,
      });
    }
  }

  if (sceneCount === 0) {
    violations.push({
      ruleId: "PHASER-01",
      file: PHASER_PATHS.scenesDir,
      message: `No scenes found in ${PHASER_PATHS.scenesDir}/ — at least one scene (boot) is required`,
    });
  }

  return violations;
}
