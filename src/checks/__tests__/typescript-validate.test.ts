import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateTypeScript } from "../typescript-validate.ts";

describe("phaser.typescript.validate", () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), "phaser-ts-"));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it("passes on a clean TypeScript project with Phaser types", async () => {
    await mkdir(join(projectRoot, "src", "scenes"), { recursive: true });
    await writeFile(
      join(projectRoot, "src", "scenes", "boot.ts"),
      `import Phaser from "phaser";
import { SCENE_KEYS } from "./scene-keys.ts";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.Boot });
  }

  preload(): void {}
  create(): void {}
}
`,
    );
    await writeFile(
      join(projectRoot, "src", "scenes", "scene-keys.ts"),
      `export const SCENE_KEYS = { Boot: "BootScene" } as const;
export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];
`,
    );
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `import Phaser from "phaser";
import { BootScene } from "./src/scenes/boot.ts";

const config: Phaser.Types.Core.GameConfig & { bundleBudget: number } = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: [BootScene],
  bundleBudget: 5242880,
};

export default config;
`,
    );

    const result = await validateTypeScript(projectRoot);

    expect(result.exitCode).toBe(0);
    expect(result.data?.status).toBe("pass");
    expect(result.data?.violations).toHaveLength(0);
  });

  it("passes when src/ directory does not exist (empty project)", async () => {
    const result = await validateTypeScript(projectRoot);

    expect(result.exitCode).toBe(0);
    expect(result.data?.status).toBe("pass");
  });

  it("fails when a .js file exists in src/ (TS-01)", async () => {
    await mkdir(join(projectRoot, "src"), { recursive: true });
    await writeFile(join(projectRoot, "src", "game.js"), "console.log('hello');\n");

    const result = await validateTypeScript(projectRoot);

    expect(result.exitCode).toBe(1);
    expect(result.data?.status).toBe("fail");
    const jsViolation = result.data?.violations.find((v) =>
      v.message.includes("TS-01"),
    );
    expect(jsViolation).toBeDefined();
    expect(jsViolation?.file).toBe("src/game.js");
  });

  it("fails when 'any' type is used (TS-02)", async () => {
    await mkdir(join(projectRoot, "src"), { recursive: true });
    await writeFile(
      join(projectRoot, "src", "scene.ts"),
      `import Phaser from "phaser";

export class MyScene extends Phaser.Scene {
  data: any = null;
}
`,
    );

    const result = await validateTypeScript(projectRoot);

    expect(result.exitCode).toBe(1);
    const anyViolation = result.data?.violations.find((v) =>
      v.message.includes("TS-02"),
    );
    expect(anyViolation).toBeDefined();
  });

  it("fails when 'as any' cast is used (TS-02)", async () => {
    await mkdir(join(projectRoot, "src"), { recursive: true });
    await writeFile(
      join(projectRoot, "src", "scene.ts"),
      `import Phaser from "phaser";

const body = sprite.body as any;
`,
    );

    const result = await validateTypeScript(projectRoot);

    expect(result.exitCode).toBe(1);
    const anyViolation = result.data?.violations.find((v) =>
      v.message.includes("TS-02"),
    );
    expect(anyViolation).toBeDefined();
  });

  it("fails when @ts-ignore is used (TS-03)", async () => {
    await mkdir(join(projectRoot, "src"), { recursive: true });
    await writeFile(
      join(projectRoot, "src", "scene.ts"),
      `import Phaser from "phaser";

// @ts-ignore
const x: number = "not a number";
`,
    );

    const result = await validateTypeScript(projectRoot);

    expect(result.exitCode).toBe(1);
    const tsViolation = result.data?.violations.find((v) =>
      v.message.includes("TS-03"),
    );
    expect(tsViolation).toBeDefined();
  });

  it("fails when @ts-nocheck is used (TS-03)", async () => {
    await mkdir(join(projectRoot, "src"), { recursive: true });
    await writeFile(
      join(projectRoot, "src", "scene.ts"),
      `// @ts-nocheck
import Phaser from "phaser";

const x: number = "not a number";
`,
    );

    const result = await validateTypeScript(projectRoot);

    expect(result.exitCode).toBe(1);
    const tsViolation = result.data?.violations.find((v) =>
      v.message.includes("TS-03"),
    );
    expect(tsViolation).toBeDefined();
  });

  it("fails when phaser.config.ts uses custom interface instead of Phaser.Types.Core.GameConfig (TS-04)", async () => {
    await mkdir(join(projectRoot, "src"), { recursive: true });
    await writeFile(join(projectRoot, "src", "dummy.ts"), "");
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `export interface MyGameConfig {
  type: number;
  width: number;
}

const config: MyGameConfig = { type: 0, width: 800 };
export default config;
`,
    );

    const result = await validateTypeScript(projectRoot);

    expect(result.exitCode).toBe(1);
    const configViolation = result.data?.violations.find((v) =>
      v.message.includes("TS-04"),
    );
    expect(configViolation).toBeDefined();
    expect(configViolation?.file).toBe("phaser.config.ts");
  });

  it("fails when scene key is hardcoded instead of using SCENE_KEYS (TS-05)", async () => {
    await mkdir(join(projectRoot, "src", "scenes"), { recursive: true });
    await writeFile(
      join(projectRoot, "src", "scenes", "boot.ts"),
      `import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }
}
`,
    );

    const result = await validateTypeScript(projectRoot);

    expect(result.exitCode).toBe(1);
    const keyViolation = result.data?.violations.find((v) =>
      v.message.includes("TS-05"),
    );
    expect(keyViolation).toBeDefined();
  });

  it("passes when scene key uses SCENE_KEYS constant (TS-05)", async () => {
    await mkdir(join(projectRoot, "src", "scenes"), { recursive: true });
    await writeFile(
      join(projectRoot, "src", "scenes", "scene-keys.ts"),
      `export const SCENE_KEYS = { Boot: "BootScene" } as const;
`,
    );
    await writeFile(
      join(projectRoot, "src", "scenes", "boot.ts"),
      `import Phaser from "phaser";
import { SCENE_KEYS } from "./scene-keys.ts";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.Boot });
  }
}
`,
    );

    const result = await validateTypeScript(projectRoot);

    expect(result.exitCode).toBe(0);
    expect(result.data?.status).toBe("pass");
  });

  it("fails when Phaser. is used without import (TS-06)", async () => {
    await mkdir(join(projectRoot, "src"), { recursive: true });
    await writeFile(
      join(projectRoot, "src", "scene.ts"),
      `export class MyScene extends Phaser.Scene {
  create() {}
}
`,
    );

    const result = await validateTypeScript(projectRoot);

    expect(result.exitCode).toBe(1);
    const importViolation = result.data?.violations.find((v) =>
      v.message.includes("TS-06"),
    );
    expect(importViolation).toBeDefined();
  });

  it("does not flag comments containing 'any' (TS-02)", async () => {
    await mkdir(join(projectRoot, "src"), { recursive: true });
    await writeFile(
      join(projectRoot, "src", "scene.ts"),
      `import Phaser from "phaser";

// This function does not return any value
export function init(): void {}
`,
    );

    const result = await validateTypeScript(projectRoot);

    expect(result.exitCode).toBe(0);
    expect(result.data?.status).toBe("pass");
  });
});
