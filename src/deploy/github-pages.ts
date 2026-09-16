/*
<MODULE_CONTRACT>
<purpose>GitHub Pages deploy adapter for the Phaser plugin — publishes the built game.</purpose>


<non-goals>
  <item>Does not build — build hook runs before deploy.</item>
  <item>Does not manage DNS or custom domains.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { DeployResult } from "./types.ts";

export interface GitHubPagesDeployConfig {
  token: string;
  repo?: string;
  branch?: string;
}

export interface GitHubPagesAdapter {
  deploy(workpiecePath: string, config: GitHubPagesDeployConfig): DeployResult;
}

export function createGitHubPagesAdapter(): GitHubPagesAdapter {
  return {
    deploy(workpiecePath: string, config: GitHubPagesDeployConfig): DeployResult {
      const distDir = join(workpiecePath, "dist");
      if (!existsSync(distDir)) {
        return {
          success: false,
          errors: [`dist/ directory not found at ${distDir} — run build first`],
        };
      }

      if (!config.token) {
        return {
          success: false,
          errors: ["GitHub token not provided in channel config (deploy.github.token)"],
        };
      }

      try {
        const args = ["gh-pages", "-d", "dist"];
        if (config.branch) {
          args.push("-b", config.branch);
        }

        const env: Record<string, string> = {
          ...process.env,
          GH_TOKEN: config.token,
        };

        if (config.repo) {
          args.push("-r", `https://x-access-token:${config.token}@github.com/${config.repo}.git`);
        }

        execFileSync("npx", ["gh-pages-clean"], {
          cwd: workpiecePath,
          encoding: "utf-8",
          timeout: 30_000,
          stdio: ["pipe", "pipe", "pipe"],
          env,
        });

        execFileSync("npx", args, {
          cwd: workpiecePath,
          encoding: "utf-8",
          timeout: 120_000,
          stdio: ["pipe", "pipe", "pipe"],
          env,
        });

        const url = config.repo
          ? `https://${config.repo.split("/")[0]}.github.io/${config.repo.split("/")[1]}`
          : undefined;

        return { success: true, url };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          errors: [`GitHub Pages deploy failed: ${message}`],
        };
      }
    },
  };
}
