/*
<MODULE_CONTRACT>
<purpose>Cloudflare Pages deploy adapter for the Phaser plugin — publishes the built game.</purpose>


<non-goals>
  <item>Does not build — build hook runs before deploy.</item>
  <item>Does not manage DNS or custom domains.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1100: subprocess call moved to shared runTool seam with injectable ToolExecutor; dist/ preflight via requireDist; no direct node:child_process import.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
  <item>RFC-1100: steps 3-6 — spec-driven checks, shared seams, scaffold table</item>
</CHANGE_SUMMARY>
*/

import { runTool } from "@warpgogol/werkstatt-shared/stack/run-tool";
import type { ToolExecutor } from "@warpgogol/werkstatt-shared/stack/run-tool";
import type { DeployResult } from "./types.ts";

export interface CloudflarePagesDeployConfig {
  apiToken: string;
  accountId?: string;
  projectName: string;
  branch?: string;
}

export interface CloudflarePagesAdapter {
  deploy(workpiecePath: string, config: CloudflarePagesDeployConfig): DeployResult;
}

export function createCloudflarePagesAdapter(executor?: ToolExecutor): CloudflarePagesAdapter {
  return {
    deploy(workpiecePath: string, config: CloudflarePagesDeployConfig): DeployResult {
      if (!config.apiToken) {
        return {
          success: false,
          errors: [
            "Cloudflare API token not provided in channel config (deploy.cloudflare.apiToken)",
          ],
        };
      }

      if (!config.projectName) {
        return {
          success: false,
          errors: [
            "Cloudflare project name not provided in channel config (deploy.cloudflare.projectName)",
          ],
        };
      }

      const env: Record<string, string> = { CLOUDFLARE_API_TOKEN: config.apiToken };
      if (config.accountId) {
        env.CLOUDFLARE_ACCOUNT_ID = config.accountId;
      }

      const args = ["wrangler", "pages", "deploy", "dist", "--project-name", config.projectName];
      if (config.branch) {
        args.push("--branch", config.branch);
      }

      const result = runTool(
        {
          bin: "npx",
          args,
          cwd: workpiecePath,
          env,
          timeoutMs: 120_000,
          requireDist: true,
        },
        executor,
      );
      if (!result.success) {
        return {
          success: false,
          errors:
            result.failedAt === "exec"
              ? [`Cloudflare Pages deploy failed: ${result.errors?.join("; ")}`]
              : result.errors,
        };
      }

      return {
        success: true,
        url: `https://${config.projectName}.pages.dev`,
      };
    },
  };
}
