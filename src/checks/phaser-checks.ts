/*
<MODULE_CONTRACT>
<purpose>PHASER_CHECKS — the single spec table for all Phaser stack validators
(RFC-1100). Command declarations, the checkGate hook body, and PHASER_INVARIANTS
rows all derive from this table via defineStackChecks.</purpose>

<non-goals>
  <item>Does not implement rule logic — check functions live in the per-validator files.</item>
  <item>Does not register commands — module.ts consumes PHASER_CHECK_DECLARATIONS.commands.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1100: initial spec table — five StackCheckSpec entries (PHASER-01..05) with contract, rules, reads, and check wiring; PHASER_CHECK_DECLARATIONS derived once for module, gate, and invariants.</item>
  <item>RFC-1100: steps 3-6 — spec-driven checks, shared seams, scaffold table</item>
</CHANGE_SUMMARY>
*/

import { defineStackChecks } from "@warpgogol/werkstatt-shared/stack/stack-checks";
import type { StackCheckSpec } from "@warpgogol/werkstatt-shared/stack/stack-checks";
import { PHASER_PATHS } from "../paths/phaser-paths.ts";
import { checkScenes } from "./scenes-validate.ts";
import { checkAssets } from "./assets-validate.ts";
import { checkBundle } from "./bundle-validate.ts";
import { checkSecrets } from "./secret-scan.ts";
import { checkTypeScript } from "./typescript-validate.ts";

export const PHASER_CHECKS: StackCheckSpec[] = [
  {
    name: "phaser.scenes.validate",
    description: "Validate scene registry consistency (PHASER-01)",
    contract: "phaser",
    rules: ["PHASER-01"],
    reads: [`${PHASER_PATHS.scenesDir}/*.ts`, PHASER_PATHS.phaserConfig],
    check: checkScenes,
  },
  {
    name: "phaser.assets.validate",
    description: "Validate asset manifest completeness (PHASER-02)",
    contract: "phaser",
    rules: ["PHASER-02"],
    reads: [`${PHASER_PATHS.assetsDir}/**`],
    check: checkAssets,
  },
  {
    name: "phaser.bundle.validate",
    description: "Validate bundle size against budget (PHASER-03)",
    contract: "phaser",
    rules: ["PHASER-03"],
    reads: [`${PHASER_PATHS.distDir}/**`, PHASER_PATHS.phaserConfig],
    check: checkBundle,
  },
  {
    name: "phaser.secret.scan",
    description: "Scan source for hardcoded secrets (PHASER-04)",
    contract: "phaser",
    rules: ["PHASER-04"],
    reads: [`${PHASER_PATHS.srcDir}/**/*.ts`],
    check: checkSecrets,
  },
  {
    name: "phaser.typescript.validate",
    description: "Validate TypeScript-first best practices (PHASER-05)",
    contract: "phaser",
    rules: ["PHASER-05"],
    reads: [
      `${PHASER_PATHS.srcDir}/**/*.ts`,
      `${PHASER_PATHS.srcDir}/**/*.js`,
      PHASER_PATHS.phaserConfig,
    ],
    check: checkTypeScript,
  },
];

export const PHASER_CHECK_DECLARATIONS = defineStackChecks(PHASER_CHECKS);
