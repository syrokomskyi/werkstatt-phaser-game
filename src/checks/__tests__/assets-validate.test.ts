import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { checkAssets } from "../assets-validate.ts";

describe("phaser.assets.validate", () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), "phaser-assets-"));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it("passes with empty manifest (freshly scaffolded project)", async () => {
    await mkdir(join(projectRoot, "src", "assets"), { recursive: true });
    await writeFile(join(projectRoot, "src", "assets", "manifest.yaml"), "assets: []\n");

    const violations = await checkAssets(projectRoot);

    expect(violations).toHaveLength(0);
  });

  it("passes with no manifest at all", async () => {
    await mkdir(join(projectRoot, "src", "assets"), { recursive: true });

    const violations = await checkAssets(projectRoot);

    expect(violations).toHaveLength(0);
  });

  it("passes when all manifest entries exist on disk", async () => {
    await mkdir(join(projectRoot, "src", "assets", "sprites"), { recursive: true });
    await writeFile(join(projectRoot, "src", "assets", "sprites", "player.png"), "fake-png");
    await writeFile(
      join(projectRoot, "src", "assets", "manifest.yaml"),
      "assets:\n  - path: sprites/player.png\n    type: image\n",
    );

    const violations = await checkAssets(projectRoot);

    expect(violations).toHaveLength(0);
  });

  it("fails when manifest entry does not exist on disk (PHASER-02)", async () => {
    await mkdir(join(projectRoot, "src", "assets"), { recursive: true });
    await writeFile(
      join(projectRoot, "src", "assets", "manifest.yaml"),
      "assets:\n  - path: missing.png\n    type: image\n",
    );

    const violations = await checkAssets(projectRoot);

    expect(violations).toHaveLength(1);
    expect(violations[0]!.ruleId).toBe("PHASER-02");
  });

  it("fails when asset file exists but is not in manifest (PHASER-02)", async () => {
    await mkdir(join(projectRoot, "src", "assets"), { recursive: true });
    await writeFile(join(projectRoot, "src", "assets", "orphan.png"), "fake-png");
    await writeFile(join(projectRoot, "src", "assets", "manifest.yaml"), "assets: []\n");

    const violations = await checkAssets(projectRoot);

    expect(violations).toHaveLength(1);
    expect(violations[0]!.ruleId).toBe("PHASER-02");
    expect(violations[0]!.message).toContain("not listed in manifest");
  });

  it("fails when manifest has invalid YAML syntax (PHASER-02)", async () => {
    await mkdir(join(projectRoot, "src", "assets"), { recursive: true });
    await writeFile(
      join(projectRoot, "src", "assets", "manifest.yaml"),
      "assets: [invalid: yaml: syntax\n",
    );

    const violations = await checkAssets(projectRoot);

    expect(violations).toHaveLength(1);
    expect(violations[0]!.ruleId).toBe("PHASER-02");
    expect(violations[0]!.message).toContain("Failed to parse");
  });
});
