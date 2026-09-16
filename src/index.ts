/*
<MODULE_CONTRACT>
<purpose>Werkstatt Phaser plugin entry point — Phaser + Vite + Turborepo stack implementing werkstatt/plugin@1.</purpose>


<non-goals>
  <item>Do not implement engine logic — delegate to @warpgogol/werkstatt-engine.</item>
  <item>Do not import stack-specific dependencies into the engine package.</item>
  <item>Do not depend on Phaser directly — validate project structure only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import type { WerkstattPlugin } from "@warpgogol/werkstatt-shared/plugin";
import type { KernelModule } from "@warpgogol/werkstatt-engine/kernel/types";
import { phaserPathConventions } from "./paths/phaser-paths.ts";
import { PHASER_INVARIANTS } from "./invariants/phaser-invariants.ts";

export const werkstattPhaserPlugin: WerkstattPlugin = {
  schema: "werkstatt/plugin@1",
  id: "werkstatt-phaser-game",
  profileId: "phaser-turborepo",
  paths: phaserPathConventions,
  moduleLoaders: {
    checks: async (): Promise<KernelModule> =>
      (await import("./checks/module.ts")).createPhaserCheckModule(),
  },
  deployAdapters: {
    "github-pages": async () => {
      const { createGitHubPagesAdapter } = await import("./deploy/github-pages.ts");
      return createGitHubPagesAdapter();
    },
    "cloudflare-pages": async () => {
      const { createCloudflarePagesAdapter } = await import("./deploy/cloudflare-pages.ts");
      return createCloudflarePagesAdapter();
    },
  },
  hooks: {
    build: async (ctx) => {
      const { runViteBuild } = await import("./build/vite-build.ts");
      return runViteBuild(ctx);
    },
    checkGate: async (ctx) => {
      const { runPhaserCheckGate } = await import("./checks/index.ts");
      return runPhaserCheckGate(ctx);
    },
    releaseEvidence: async (ctx) => {
      const { generatePhaserEvidence } = await import("./release-evidence/phaser-evidence.ts");
      return generatePhaserEvidence(ctx);
    },
    scaffoldProject: async (ctx) => {
      const { scaffoldPhaserProject } = await import("./onboarding/scaffold-project.ts");
      return scaffoldPhaserProject(ctx);
    },
  },
  invariants: PHASER_INVARIANTS,
};

export default werkstattPhaserPlugin;
