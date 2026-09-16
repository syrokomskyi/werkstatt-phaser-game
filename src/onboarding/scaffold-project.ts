/*
<MODULE_CONTRACT>
<purpose>Phaser project scaffold hook — generates a new Phaser project with scene boilerplate.</purpose>


<non-goals>
  <item>Does not install dependencies — the consumer runs pnpm install after scaffold.</item>
  <item>Does not create game content — games are projects, not plugin content.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1100: scaffold now renders from the centralized SCAFFOLD_FILES table — each entry declares path, render(ctx), and mkdirs; filesCreated is derived from the table so the reported list always equals the written set; package.json renders via parameterized object build (no string replace).</item>
  <item>RFC-0933: TypeScript-first scaffold — Phaser.Types.Core.GameConfig, SCENE_KEYS constants, typed lifecycle, no as-cast in main.ts.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
  <item>RFC-1100: steps 3-6 — spec-driven checks, shared seams, scaffold table</item>
</CHANGE_SUMMARY>
*/

import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { writeFileIfChanged } from "@warpgogol/werkstatt-engine/kernel";
import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";

const SCENE_KEYS_TS = `export const SCENE_KEYS = {
  Boot: "BootScene",
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];
`;

const BOOT_SCENE_TS = `import Phaser from "phaser";
import { SCENE_KEYS } from "./scene-keys.ts";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.Boot });
  }

  preload(): void {
    // Load assets here
  }

  create(): void {
    // Boot scene — initialise global game systems here.
    // Transition to the next scene via this.scene.start(SCENE_KEYS.NextScene).
  }
}
`;

const PHASER_CONFIG_TS = `import Phaser from "phaser";
import { BootScene } from "./src/scenes/boot.ts";

const config: Phaser.Types.Core.GameConfig & { bundleBudget: number } = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: [BootScene],
  bundleBudget: 5242880, // 5 MB gzipped
};

export default config;
`;

const MANIFEST_YAML = `# Asset manifest — list all game assets here
# Each entry: { path: <relative-to-src/assets>, type: <image|audio|spritesheet|atlas> }
assets: []
`;

function renderPackageJson(projectId: string): string {
  return `${JSON.stringify(
    {
      name: projectId,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview",
      },
      dependencies: {
        phaser: "^3.90.0",
      },
      devDependencies: {
        typescript: "^5.5.0",
        vite: "^5.4.0",
      },
    },
    null,
    2,
  )}\n`;
}

const TSCONFIG_JSON = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": ".",
    "types": ["phaser"]
  },
  "include": ["src/**/*.ts", "phaser.config.ts"]
}
`;

const VITE_CONFIG_TS = `import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    target: "es2022",
  },
  server: {
    port: 3000,
  },
});
`;

const MAIN_TS = `import Phaser from "phaser";
import config from "../phaser.config.ts";

const game = new Phaser.Game(config);
export default game;
`;

interface ScaffoldRenderContext {
  projectId: string;
}

interface ScaffoldFileEntry {
  /** Project-relative output path. */
  path: string;
  /** Content renderer — parameterized by the render context. */
  render: (ctx: ScaffoldRenderContext) => string;
  /** Directories to create before writing this file. */
  mkdirs?: string[];
}

/** Directories with no files — created up front. */
const SCAFFOLD_DIRS = ["public"] as const;

const SCAFFOLD_FILES: ScaffoldFileEntry[] = [
  { path: "src/scenes/scene-keys.ts", render: () => SCENE_KEYS_TS, mkdirs: ["src/scenes"] },
  { path: "src/scenes/boot.ts", render: () => BOOT_SCENE_TS },
  { path: "src/assets/manifest.yaml", render: () => MANIFEST_YAML, mkdirs: ["src/assets"] },
  { path: "src/main.ts", render: () => MAIN_TS },
  { path: "phaser.config.ts", render: () => PHASER_CONFIG_TS },
  { path: "vite.config.ts", render: () => VITE_CONFIG_TS },
  { path: "package.json", render: (ctx) => renderPackageJson(ctx.projectId) },
  { path: "tsconfig.json", render: () => TSCONFIG_JSON },
];

export async function scaffoldPhaserProject(
  ctx: PluginHookContext & { projectId?: string },
): Promise<HookResult> {
  const projectPath = ctx.workpiecePath ?? ctx.workspaceRoot;
  const projectId = ctx.projectId ?? "my-phaser-game";

  ctx.logger.info(`scaffold-project: creating Phaser project at ${projectPath}`);

  try {
    for (const dir of SCAFFOLD_DIRS) {
      await mkdir(join(projectPath, dir), { recursive: true });
    }

    for (const entry of SCAFFOLD_FILES) {
      for (const dir of entry.mkdirs ?? []) {
        await mkdir(join(projectPath, dir), { recursive: true });
      }
      await writeFileIfChanged(join(projectPath, entry.path), entry.render({ projectId }));
    }

    ctx.logger.info("scaffold-project: project created successfully");
    return {
      success: true,
      data: {
        projectPath,
        filesCreated: SCAFFOLD_FILES.map((entry) => entry.path),
        directoriesCreated: [...SCAFFOLD_DIRS],
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    ctx.logger.error("scaffold-project: failed", { error: message });
    return {
      success: false,
      errors: [`scaffoldProject failed: ${message}`],
    };
  }
}
