/*
<MODULE_CONTRACT>
<purpose>Phaser check module — registers Phaser validators as kernel commands.</purpose>

<non-goals>
  <item>Do not implement validator logic here — delegate to individual validator files.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/


import { createAssetsValidateCommand } from "./assets-validate.ts";
import { createScenesValidateCommand } from "./scenes-validate.ts";
import { createBundleValidateCommand } from "./bundle-validate.ts";
import { createSecretScanCommand } from "./secret-scan.ts";
import { createTypeScriptValidateCommand } from "./typescript-validate.ts";
import type { ModuleExport } from "@warpgogol/werkstatt-engine/runtime/desired-state";

export function createPhaserCheckModule(): ModuleExport {
  return {
    name: "phaser-checks",
    version: "0.1.0",
      declarations: [],
  commands: [
      createAssetsValidateCommand(),
      createScenesValidateCommand(),
      createBundleValidateCommand(),
      createSecretScanCommand(),
      createTypeScriptValidateCommand(),
    ],
  pipelines: [

  ]};
}
