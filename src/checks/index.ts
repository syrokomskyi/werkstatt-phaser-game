/*
<MODULE_CONTRACT>
<purpose>Check gate index composition for the Phaser plugin — wires all phaser validators.</purpose>


<non-goals>
  <item>Do not implement validator logic — orchestrate validators only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";
import { validateAssets } from "./assets-validate.ts";
import { validateScenes } from "./scenes-validate.ts";
import { validateBundle } from "./bundle-validate.ts";
import { scanSecrets } from "./secret-scan.ts";
import { validateTypeScript } from "./typescript-validate.ts";

export async function runPhaserCheckGate(ctx: PluginHookContext): Promise<HookResult> {
  const projectRoot = ctx.workpiecePath ?? ctx.workspaceRoot;
  const errors: string[] = [];

  const assetsResult = await validateAssets(projectRoot);
  if (assetsResult.exitCode !== 0) {
    errors.push(`phaser.assets.validate: ${assetsResult.data?.violations.length ?? 0} violations`);
  }

  const scenesResult = await validateScenes(projectRoot);
  if (scenesResult.exitCode !== 0) {
    errors.push(`phaser.scenes.validate: ${scenesResult.data?.violations.length ?? 0} violations`);
  }

  const bundleResult = await validateBundle(projectRoot);
  if (bundleResult.exitCode !== 0) {
    errors.push(`phaser.bundle.validate: bundle exceeds budget`);
  }

  const secretResult = await scanSecrets(projectRoot);
  if (secretResult.exitCode !== 0) {
    errors.push(`phaser.secret.scan: ${secretResult.data?.violations.length ?? 0} violations`);
  }

  const tsResult = await validateTypeScript(projectRoot);
  if (tsResult.exitCode !== 0) {
    errors.push(`phaser.typescript.validate: ${tsResult.data?.violations.length ?? 0} violations`);
  }

  ctx.logger.info(
    `checkGate: assets=${assetsResult.data?.status}, scenes=${scenesResult.data?.status}, bundle=${bundleResult.data?.status}, secrets=${secretResult.data?.status}, typescript=${tsResult.data?.status}`,
  );

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export { validateAssets } from "./assets-validate.ts";
export { validateScenes } from "./scenes-validate.ts";
export { validateBundle } from "./bundle-validate.ts";
export { scanSecrets } from "./secret-scan.ts";
export { validateTypeScript } from "./typescript-validate.ts";
