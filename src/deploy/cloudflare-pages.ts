/*
<MODULE_CONTRACT>
<purpose>Cloudflare Pages deploy adapter for the Phaser plugin — publishes the built game.</purpose>


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

export interface CloudflarePagesDeployConfig {
  apiToken: string;
  accountId?: string;
  projectName: string;
  branch?: string;
}

export interface CloudflarePagesAdapter {
  deploy(workpiecePath: string, config: CloudflarePagesDeployConfig): DeployResult;
}

export function createCloudflarePagesAdapter(): CloudflarePagesAdapter {
  return {
    deploy(workpiecePath: string, config: CloudflarePagesDeployConfig): DeployResult {
      const distDir = join(workpiecePath, "dist");
      if (!existsSync(distDir)) {
        return {
          success: false,
          errors: [`dist/ directory not found at ${distDir} — run build first`],
        };
      }

      if (!config.apiToken) {
        return {
          success: false,
          errors: ["Cloudflare API token not provided in channel config (deploy.cloudflare.apiToken)"],
        };
      }

      if (!config.projectName) {
        return {
          success: false,
          errors: ["Cloudflare project name not provided in channel config (deploy.cloudflare.projectName)"],
        };
      }

      try {
        const args = ["wrangler", "pages", "deploy", "dist", "--project-name", config.projectName];
        if (config.branch) {
          args.push("--branch", config.branch);
        }

        const env: Record<string, string> = {
          ...process.env,
          CLOUDFLARE_API_TOKEN: config.apiToken,
        };

        if (config.accountId) {
          env.CLOUDFLARE_ACCOUNT_ID = config.accountId;
        }

        execFileSync("npx", args, {
          cwd: workpiecePath,
          encoding: "utf-8",
          timeout: 120_000,
          stdio: ["pipe", "pipe", "pipe"],
          env,
        });

        return {
          success: true,
          url: `https://${config.projectName}.pages.dev`,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          errors: [`Cloudflare Pages deploy failed: ${message}`],
        };
      }
    },
  };
}
