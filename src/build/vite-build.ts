/*
<MODULE_CONTRACT>
<purpose>Vite build hook for the Phaser plugin — runs npx vite build in the workpiece directory.</purpose>


<non-goals>
  <item>Does not manage deployment — deploy adapters run after build.</item>
  <item>Does not run check gates — checkGate is a separate hook.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import { execFileSync } from "node:child_process";
import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";

export async function runViteBuild(ctx: PluginHookContext): Promise<HookResult> {
  const workpiecePath = ctx.workpiecePath ?? ctx.workspaceRoot;

  try {
    const output = execFileSync("npx", ["vite", "build"], {
      cwd: workpiecePath,
      encoding: "utf-8",
      timeout: 120_000,
      stdio: ["pipe", "pipe", "pipe"],
    });

    ctx.logger.info(`vite build completed:\n${output}`);

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    ctx.logger.error(`vite build failed: ${message}`);
    return {
      success: false,
      errors: [`vite build failed: ${message}`],
    };
  }
}
