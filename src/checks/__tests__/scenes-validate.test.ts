import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { checkScenes } from "../scenes-validate.ts";

describe("phaser.scenes.validate", () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), "phaser-scenes-"));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it("passes when all scenes are registered in phaser.config.ts", async () => {
    await mkdir(join(projectRoot, "src", "scenes"), { recursive: true });
    await writeFile(join(projectRoot, "src", "scenes", "boot.ts"), "export class BootScene {}");
    await writeFile(join(projectRoot, "src", "scenes", "menu.ts"), "export class MenuScene {}");
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `export default {
  scenes: [
    { key: "BootScene", scene: BootScene },
    { key: "MenuScene", scene: MenuScene },
  ],
  bundleBudget: 5242880,
};`,
    );

    const violations = await checkScenes(projectRoot);

    expect(violations).toHaveLength(0);
  });

  it("fails when a scene is not registered (PHASER-01)", async () => {
    await mkdir(join(projectRoot, "src", "scenes"), { recursive: true });
    await writeFile(join(projectRoot, "src", "scenes", "boot.ts"), "export class BootScene {}");
    await writeFile(join(projectRoot, "src", "scenes", "level01.ts"), "export class Level01Scene {}");
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `export default {
  scenes: [
    { key: "BootScene", scene: BootScene },
  ],
};`,
    );

    const violations = await checkScenes(projectRoot);

    const unregistered = violations.find((v) => v.file === "src/scenes/level01.ts");
    expect(unregistered).toBeDefined();
    expect(unregistered?.ruleId).toBe("PHASER-01");
  });

  it("fails when zero scenes exist (PHASER-01)", async () => {
    await mkdir(join(projectRoot, "src", "scenes"), { recursive: true });
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `export default { scenes: [] };`,
    );

    const violations = await checkScenes(projectRoot);

    expect(violations).toHaveLength(1);
    expect(violations[0]!.ruleId).toBe("PHASER-01");
    expect(violations[0]!.message).toContain("No scenes found");
  });

  it("passes with a single boot scene (empty-state)", async () => {
    await mkdir(join(projectRoot, "src", "scenes"), { recursive: true });
    await writeFile(join(projectRoot, "src", "scenes", "boot.ts"), "export class BootScene {}");
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `export default {
  scenes: [{ key: "BootScene", scene: BootScene }],
};`,
    );

    const violations = await checkScenes(projectRoot);

    expect(violations).toHaveLength(0);
  });
});
