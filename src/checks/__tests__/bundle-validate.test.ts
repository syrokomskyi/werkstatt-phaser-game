import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { checkBundle, DEFAULT_BUNDLE_BUDGET } from "../bundle-validate.ts";

describe("phaser.bundle.validate", () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), "phaser-bundle-"));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it("passes when bundle is under the configured budget", async () => {
    await mkdir(join(projectRoot, "dist"), { recursive: true });
    await writeFile(join(projectRoot, "dist", "game.js"), "console.log('hello');");
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `export default { bundleBudget: 5242880 };`,
    );

    const violations = await checkBundle(projectRoot);

    expect(violations).toHaveLength(0);
  });

  it("fails when bundle exceeds budget (PHASER-03)", async () => {
    await mkdir(join(projectRoot, "dist"), { recursive: true });
    await writeFile(join(projectRoot, "dist", "game.js"), randomBytes(64 * 1024));
    await writeFile(join(projectRoot, "phaser.config.ts"), `export default { bundleBudget: 100 };`);

    const violations = await checkBundle(projectRoot);

    expect(violations).toHaveLength(1);
    expect(violations[0]!.ruleId).toBe("PHASER-03");
    expect(violations[0]!.details?.bundleBytes).toBeGreaterThan(0);
    expect(violations[0]!.details?.budgetBytes).toBe(100);
  });

  it("uses default 5 MB budget when phaser.config.ts has no bundleBudget", async () => {
    await mkdir(join(projectRoot, "dist"), { recursive: true });
    // Incompressible payload larger than the default budget.
    await writeFile(join(projectRoot, "dist", "game.js"), randomBytes(6 * 1024 * 1024));
    await writeFile(join(projectRoot, "phaser.config.ts"), `export default { scenes: [] };`);

    const violations = await checkBundle(projectRoot);

    expect(violations).toHaveLength(1);
    expect(violations[0]!.details?.budgetBytes).toBe(DEFAULT_BUNDLE_BUDGET);
  });

  it("uses default budget when phaser.config.ts is missing", async () => {
    await mkdir(join(projectRoot, "dist"), { recursive: true });
    await writeFile(join(projectRoot, "dist", "game.js"), randomBytes(6 * 1024 * 1024));

    const violations = await checkBundle(projectRoot);

    expect(violations).toHaveLength(1);
    expect(violations[0]!.details?.budgetBytes).toBe(DEFAULT_BUNDLE_BUDGET);
  });

  it("passes with empty dist/ (zero bundle)", async () => {
    await mkdir(join(projectRoot, "dist"), { recursive: true });

    const violations = await checkBundle(projectRoot);

    expect(violations).toHaveLength(0);
  });
});
