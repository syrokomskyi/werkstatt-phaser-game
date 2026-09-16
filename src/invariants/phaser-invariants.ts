/*
<MODULE_CONTRACT>
<purpose>Phaser stack invariants PHASER-01..04 surfaced to agents as the canonical rule list.</purpose>

<non-goals>
  <item>Do not enforce invariants here — enforcement lives in validators.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1100: PHASER_INVARIANTS now derives id/check pairs from PHASER_CHECK_DECLARATIONS.invariantRows — the spec table is the single declaration site; descriptions stay local.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
  <item>RFC-1100: steps 3-6 — spec-driven checks, shared seams, scaffold table</item>
</CHANGE_SUMMARY>
*/

import type { StackInvariant } from "@warpgogol/werkstatt-shared/plugin";
import { PHASER_CHECK_DECLARATIONS } from "../checks/phaser-checks.ts";

const INVARIANT_DESCRIPTIONS: Record<string, string> = {
  "PHASER-01": "Every scene in src/scenes/ must be registered in phaser.config.ts",
  "PHASER-02":
    "Every asset referenced by a scene must exist in src/assets/ and be listed in the asset manifest",
  "PHASER-03": "Bundle size must not exceed the declared budget (default 5 MB gzipped)",
  "PHASER-04":
    "No hardcoded API keys or secrets in game source — enforced by secret scan in checkGate",
  "PHASER-05":
    "TypeScript-first source: no .js files, no any types, no ts-ignore, use Phaser.Types.Core.GameConfig and SCENE_KEYS constants",
};

export const PHASER_INVARIANTS: StackInvariant[] = PHASER_CHECK_DECLARATIONS.invariantRows.map(
  (row) => ({
    id: row.id,
    description: INVARIANT_DESCRIPTIONS[row.id] ?? row.id,
    check: row.command,
  }),
);
