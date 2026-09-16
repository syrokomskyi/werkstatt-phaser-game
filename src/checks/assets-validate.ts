/*
<MODULE_CONTRACT>
<purpose>phaser.assets.validate — checks asset manifest completeness for the game build (PHASER-02).</purpose>

<non-goals>
  <item>Does not modify files — read-only validator.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import { readFile, readdir, access } from "node:fs/promises";
import { join } from "node:path";
import type { Dirent } from "node:fs";
import { parse as parseYaml } from "yaml";
import type {
  KernelCommandDefinition,
  KernelCommandResult,
} from "@warpgogol/werkstatt-engine/kernel/types";

export interface AssetManifestEntry {
  path: string;
  type?: string;
}

export interface AssetManifest {
  assets: AssetManifestEntry[];
}

export interface AssetsValidateViolation {
  ruleId: string;
  file: string;
  message: string;
}

export interface AssetsValidateData {
  command: string;
  status: "pass" | "fail";
  violations: AssetsValidateViolation[];
}

const ASSETS_DIR = "src/assets";
const MANIFEST_PATH = "src/assets/manifest.yaml";

export async function validateAssets(
  projectRoot: string,
): Promise<KernelCommandResult<AssetsValidateData>> {
  const violations: AssetsValidateViolation[] = [];
  const manifestPath = join(projectRoot, MANIFEST_PATH);

  let manifest: AssetManifest = { assets: [] };
  let manifestParseError: string | undefined;
  try {
    const raw = await readFile(manifestPath, "utf-8");
    try {
      const parsed = parseYaml(raw) as AssetManifest | undefined;
      if (parsed && Array.isArray(parsed.assets)) {
        manifest = parsed;
      }
    } catch (parseErr) {
      manifestParseError = parseErr instanceof Error ? parseErr.message : String(parseErr);
    }
  } catch {
    // File not found = empty manifest (valid for freshly scaffolded projects)
  }

  if (manifestParseError) {
    violations.push({
      ruleId: "PHASER-02",
      file: MANIFEST_PATH,
      message: `Failed to parse asset manifest: ${manifestParseError}`,
    });
  }

  for (const entry of manifest.assets) {
    const fullPath = join(projectRoot, ASSETS_DIR, entry.path);
    try {
      await access(fullPath);
    } catch {
      violations.push({
        ruleId: "PHASER-02",
        file: join(ASSETS_DIR, entry.path),
        message: `Asset listed in manifest but not found on disk: ${entry.path}`,
      });
    }
  }

  const manifestPaths = new Set(manifest.assets.map((a) => a.path));
  const assetFiles = await listAssetFiles(join(projectRoot, ASSETS_DIR));
  for (const relPath of assetFiles) {
    if (relPath !== "manifest.yaml" && !manifestPaths.has(relPath)) {
      violations.push({
        ruleId: "PHASER-02",
        file: join(ASSETS_DIR, relPath),
        message: `Asset file exists but is not listed in manifest: ${relPath}`,
      });
    }
  }

  const status = violations.length === 0 ? "pass" : "fail";
  return {
    data: { command: "phaser.assets.validate", status, violations },
    exitCode: status === "pass" ? 0 : 1,
    summary: `phaser.assets.validate: ${status} (${violations.length} violations)`,
  };
}

async function listAssetFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const sub = await listAssetFiles(join(dir, entry.name));
      for (const s of sub) {
        results.push(join(entry.name, s));
      }
    } else {
      results.push(entry.name);
    }
  }
  return results;
}

export function createAssetsValidateCommand(): KernelCommandDefinition<AssetsValidateData> {
  return {
    name: "phaser.assets.validate",
    contract: "phaser",
    rules: [],
    description: "Validate asset manifest completeness (PHASER-02)",
    scope: "workspace",
    cacheable: false,
    async execute(_input, context) {
      const projectRoot = context.workspaceRoot;
      return validateAssets(projectRoot);
    },
  };
}
