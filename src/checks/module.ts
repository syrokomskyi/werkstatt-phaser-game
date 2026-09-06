/*
<MODULE_CONTRACT>
<purpose>Phaser check module — registers Phaser validators as kernel commands.</purpose>
<keywords>checks, validators, phaser</keywords>
<non-goals>
  <item>Do not implement validator logic here — delegate to individual validator files.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial Phaser check module — registers phaser.assets.validate, phaser.scenes.validate, phaser.bundle.validate, phaser.secret.scan.</item>
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
