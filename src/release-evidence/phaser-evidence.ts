/*
<MODULE_CONTRACT>
<purpose>Phaser release evidence hook — generates bundle hash, asset manifest hash, scene registry hash.</purpose>


<non-goals>
  <item>Does not verify hashes — that is the integrity module's job.</item>
  <item>Does not modify files — read-only hook.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>DNA-53: replace node:crypto createHash with byteHashFile/byteHash from @warpgogol/werkstatt-engine/fingerprint.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { byteHash, byteHashFile } from "@warpgogol/werkstatt-engine/fingerprint";
import type { Dirent } from "node:fs";
import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";

export interface PhaserReleaseEvidence {
  bundleHash: string;
  assetManifestHash: string;
  sceneRegistryHash: string;
  bundleBytes: number;
  generatedAt: string;
}

export async function generatePhaserEvidence(ctx: PluginHookContext): Promise<HookResult> {
  const projectRoot = ctx.workpiecePath ?? ctx.workspaceRoot;

  const bundleHash = await hashDirectory(join(projectRoot, "dist"));
  const assetManifestHash = await hashFile(join(projectRoot, "src", "assets", "manifest.yaml"));
  const sceneRegistryHash = await hashFile(join(projectRoot, "phaser.config.ts"));
  const bundleBytes = await measureDirSize(join(projectRoot, "dist"));

  const evidence: PhaserReleaseEvidence = {
    bundleHash,
    assetManifestHash,
    sceneRegistryHash,
    bundleBytes,
    generatedAt: new Date().toISOString(),
  };

  ctx.logger.info("release-evidence: generated", evidence);

  return {
    success: true,
    data: evidence,
  };
}

async function hashFile(filePath: string): Promise<string> {
  try {
    const digest = await byteHashFile(filePath);
    return digest.slice("sha256:".length);
  } catch {
    return "0000000000000000000000000000000000000000000000000000000000000000";
  }
}

async function hashDirectory(dirPath: string): Promise<string> {
  const files = await listFiles(dirPath);
  if (files.length === 0) {
    return "0000000000000000000000000000000000000000000000000000000000000000";
  }
  const chunks: Buffer[] = [];
  for (const filePath of files.sort()) {
    const content = await readFile(filePath);
    chunks.push(content);
  }
  return byteHash(Buffer.concat(chunks)).slice("sha256:".length);
}

async function measureDirSize(dirPath: string): Promise<number> {
  const files = await listFiles(dirPath);
  let total = 0;
  for (const filePath of files) {
    try {
      const content = await readFile(filePath);
      total += content.length;
    } catch {
      // Skip
    }
  }
  return total;
}

async function listFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listFiles(fullPath)));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}
