/*
<MODULE_CONTRACT>
<purpose>Phaser stack invariants PHASER-01..04 surfaced to agents as the canonical rule list.</purpose>

<non-goals>
  <item>Do not enforce invariants here — enforcement lives in validators.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
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
