/*
<MODULE_CONTRACT>
<purpose>Phaser stack invariants PHASER-01..04 surfaced to agents.</purpose>

<non-goals>
  <item>Do not enforce invariants here — enforcement lives in validators.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import type { StackInvariant } from "@warpgogol/werkstatt-shared/plugin";

export const PHASER_INVARIANTS: StackInvariant[] = [
  {
    id: "PHASER-01",
    description: "Every scene in src/scenes/ must be registered in phaser.config.ts",
    check: "phaser.scenes.validate",
  },
  {
    id: "PHASER-02",
    description:
      "Every asset referenced by a scene must exist in src/assets/ and be listed in the asset manifest",
    check: "phaser.assets.validate",
  },
  {
    id: "PHASER-03",
    description: "Bundle size must not exceed the declared budget (default 5 MB gzipped)",
    check: "phaser.bundle.validate",
  },
  {
    id: "PHASER-04",
    description:
      "No hardcoded API keys or secrets in game source — enforced by secret scan in checkGate",
    check: "phaser.secret.scan",
  },
  {
    id: "PHASER-05",
    description:
      "TypeScript-first source: no .js files, no any types, no ts-ignore, use Phaser.Types.Core.GameConfig and SCENE_KEYS constants",
    check: "phaser.typescript.validate",
  },
];
