/*
<MODULE_CONTRACT>
<purpose>GitHub Pages deploy adapter for the Phaser plugin — publishes the built game.</purpose>


<non-goals>
  <item>Does not build — build hook runs before deploy.</item>
  <item>Does not manage DNS or custom domains.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1100: subprocess calls moved to shared runTool seam with injectable ToolExecutor; dist/ preflight via requireDist; no direct node:child_process import.</item>
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

export interface GitHubPagesDeployConfig {
  token: string;
  repo?: string;
  branch?: string;
}

export interface GitHubPagesAdapter {
  deploy(workpiecePath: string, config: GitHubPagesDeployConfig): DeployResult;
}

export function createGitHubPagesAdapter(executor?: ToolExecutor): GitHubPagesAdapter {
  return {
    deploy(workpiecePath: string, config: GitHubPagesDeployConfig): DeployResult {
      if (!config.token) {
        return {
          success: false,
          errors: ["GitHub token not provided in channel config (deploy.github.token)"],
        };
      }

      const env: Record<string, string> = { GH_TOKEN: config.token };

      const clean = runTool(
        {
          bin: "npx",
          args: ["gh-pages-clean"],
          cwd: workpiecePath,
          env,
          timeoutMs: 30_000,
          requireDist: true,
        },
        executor,
      );
      if (!clean.success) {
        return {
          success: false,
          errors:
            clean.failedAt === "exec"
              ? [`GitHub Pages deploy failed: ${clean.errors?.join("; ")}`]
              : clean.errors,
        };
      }

      const args = ["gh-pages", "-d", "dist"];
      if (config.branch) {
        args.push("-b", config.branch);
      }
      if (config.repo) {
        args.push("-r", `https://x-access-token:${config.token}@github.com/${config.repo}.git`);
      }

      const result = runTool(
        { bin: "npx", args, cwd: workpiecePath, env, timeoutMs: 120_000 },
        executor,
      );
      if (!result.success) {
        return {
          success: false,
          errors: [`GitHub Pages deploy failed: ${result.errors?.join("; ")}`],
        };
      }

      const url = config.repo
        ? `https://${config.repo.split("/")[0]}.github.io/${config.repo.split("/")[1]}`
        : undefined;

      return { success: true, url };
    },
  };
}
