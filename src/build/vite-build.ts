/*
<MODULE_CONTRACT>
<purpose>Vite build hook for the Phaser plugin — runs npx vite build in the workpiece directory.</purpose>


<non-goals>
  <item>Does not manage deployment — deploy adapters run after build.</item>
  <item>Does not run check gates — checkGate is a separate hook.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1100: subprocess call moved to shared runTool seam — no direct node:child_process import.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
  <item>RFC-1100: steps 3-6 — spec-driven checks, shared seams, scaffold table</item>
</CHANGE_SUMMARY>
*/

import { runTool } from "@warpgogol/werkstatt-shared/stack/run-tool";
import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";

export async function runViteBuild(ctx: PluginHookContext): Promise<HookResult> {
  const workpiecePath = ctx.workpiecePath ?? ctx.workspaceRoot;

  const result = runTool({
    bin: "npx",
    args: ["vite", "build"],
    cwd: workpiecePath,
    timeoutMs: 120_000,
  });

  if (!result.success) {
    const message = result.errors?.join("; ") ?? "unknown error";
    ctx.logger.error(`vite build failed: ${message}`);
    return {
      success: false,
      errors: [`vite build failed: ${message}`],
    };
  }

  ctx.logger.info(`vite build completed:\n${result.stdout ?? ""}`);
  return { success: true };
}
