/*
<MODULE_CONTRACT>
<purpose>Phaser path conventions for the Phaser plugin.</purpose>

<non-goals>
  <item>Do not import from any @warpgogol/* package — pure path constants only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import type { StackPathConventions } from "@warpgogol/werkstatt-shared/plugin";

export const phaserPathConventions: StackPathConventions = {
  contentDir: "src",
  distDir: "dist",
  entryPoints: ["phaser.config.ts", "src/main.ts"],
};

export const PHASER_PATHS = {
  scenesDir: "src/scenes",
  assetsDir: "src/assets",
  assetManifest: "src/assets/manifest.yaml",
  phaserConfig: "phaser.config.ts",
  publicDir: "public",
  distDir: "dist",
  mainEntry: "src/main.ts",
} as const;
