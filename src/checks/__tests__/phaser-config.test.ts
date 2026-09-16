import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readPhaserConfig } from "../../config/phaser-config.ts";

describe("readPhaserConfig", () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), "phaser-config-"));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it("returns the empty model when phaser.config.ts is missing", async () => {
    const model = await readPhaserConfig(projectRoot);

    expect(model.sceneKeys).toEqual([]);
    expect(model.bundleBudget).toBeNull();
    expect(model.usesGameConfigType).toBe(false);
    expect(model.raw).toBe("");
  });

  it("extracts scene identifiers from a scene array", async () => {
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `import Phaser from "phaser";
import { BootScene } from "./src/scenes/boot.ts";
import { MainScene } from "./src/scenes/main.ts";

const config: Phaser.Types.Core.GameConfig & { bundleBudget: number } = {
  type: Phaser.AUTO,
  scene: [BootScene, MainScene],
  bundleBudget: 5242880,
};

export default config;
`,
    );

    const model = await readPhaserConfig(projectRoot);

    expect(model.sceneKeys.sort()).toEqual(["BootScene", "MainScene"]);
    expect(model.bundleBudget).toBe(5242880);
    expect(model.usesGameConfigType).toBe(true);
    expect(model.raw).toContain("BootScene");
  });

  it("extracts a bare scene identifier without array brackets", async () => {
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `export default { scene: BootScene };`,
    );

    const model = await readPhaserConfig(projectRoot);

    expect(model.sceneKeys).toEqual(["BootScene"]);
  });

  it("extracts key strings from scenes object entries", async () => {
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `export default {
  scenes: [
    { key: "boot-scene", scene: BootScene },
    { key: 'main-scene' },
  ],
};`,
    );

    const model = await readPhaserConfig(projectRoot);

    expect(model.sceneKeys.sort()).toEqual(["BootScene", "boot-scene", "main-scene"]);
  });

  it("ignores commented-out scene entries", async () => {
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `export default {
  scene: [
    BootScene,
    // DisabledScene,
    /* CutScene, */
  ],
};`,
    );

    const model = await readPhaserConfig(projectRoot);

    expect(model.sceneKeys).toEqual(["BootScene"]);
  });

  it("handles multiline and quoted scene property keys", async () => {
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `export default {
  "scene": [
    BootScene,
  ],
};`,
    );

    const model = await readPhaserConfig(projectRoot);

    expect(model.sceneKeys).toEqual(["BootScene"]);
  });

  it("returns null bundleBudget when the property is absent", async () => {
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `export default { scene: [BootScene] };`,
    );

    const model = await readPhaserConfig(projectRoot);

    expect(model.bundleBudget).toBeNull();
  });

  it("detects Phaser.Types.Core.GameConfig in an intersection type", async () => {
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `const config: Phaser.Types.Core.GameConfig & { bundleBudget: number } = {
  scene: [BootScene],
  bundleBudget: 100,
};
export default config;`,
    );

    const model = await readPhaserConfig(projectRoot);

    expect(model.usesGameConfigType).toBe(true);
  });

  it("reports usesGameConfigType false for a custom config interface", async () => {
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `export interface MyGameConfig { type: number }
const config: MyGameConfig = { type: 0 };
export default config;`,
    );

    const model = await readPhaserConfig(projectRoot);

    expect(model.usesGameConfigType).toBe(false);
  });
});
