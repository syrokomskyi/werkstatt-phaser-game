import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PHASER_CHECKS, PHASER_CHECK_DECLARATIONS } from "../phaser-checks.ts";
import { PHASER_INVARIANTS } from "../../invariants/phaser-invariants.ts";
import type { StackCheckData } from "@warpgogol/werkstatt-shared/share/stack-checks";
import type {
  KernelCommandInput,
  KernelRuntimeContext,
} from "@warpgogol/werkstatt-engine/kernel/types";

const INPUT: KernelCommandInput = { argv: [], flags: {} };

function kernelCtx(projectRoot: string): KernelRuntimeContext {
  return { workspaceRoot: projectRoot } as unknown as KernelRuntimeContext;
}

const EXPECTED_SPECS = [
  { name: "phaser.scenes.validate", rule: "PHASER-01" },
  { name: "phaser.assets.validate", rule: "PHASER-02" },
  { name: "phaser.bundle.validate", rule: "PHASER-03" },
  { name: "phaser.secret.scan", rule: "PHASER-04" },
  { name: "phaser.typescript.validate", rule: "PHASER-05" },
];

describe("PHASER_CHECKS spec table", () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), "phaser-checks-"));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it("declares exactly the five phaser checks in order", () => {
    expect(PHASER_CHECKS.map((s) => s.name)).toEqual(EXPECTED_SPECS.map((s) => s.name));
  });

  it("every spec carries contract, rules, reads, and a check function", () => {
    for (const spec of PHASER_CHECKS) {
      expect(spec.contract).toBe("phaser");
      expect(spec.rules.length).toBeGreaterThan(0);
      expect(spec.reads.length).toBeGreaterThan(0);
      expect(typeof spec.check).toBe("function");
    }
  });

  it("emitted commands keep identical names and rule IDs (AC-5)", () => {
    const commands = PHASER_CHECK_DECLARATIONS.commands;
    expect(commands.map((c) => c.name)).toEqual(EXPECTED_SPECS.map((s) => s.name));
    for (const [i, cmd] of commands.entries()) {
      expect(cmd.rules).toContain(EXPECTED_SPECS[i]!.rule);
    }
  });

  it("PHASER_INVARIANTS derives id/check pairs from the spec (AC-1)", () => {
    expect(PHASER_INVARIANTS).toHaveLength(5);
    for (const [i, invariant] of PHASER_INVARIANTS.entries()) {
      expect(invariant.id).toBe(EXPECTED_SPECS[i]!.rule);
      expect(invariant.check).toBe(EXPECTED_SPECS[i]!.name);
      expect(invariant.description.length).toBeGreaterThan(0);
    }
  });

  it("command execute returns the KernelCommandResult envelope (AC-5)", async () => {
    await mkdir(join(projectRoot, "src", "scenes"), { recursive: true });
    await writeFile(join(projectRoot, "src", "scenes", "boot.ts"), "export class BootScene {}");
    await writeFile(
      join(projectRoot, "phaser.config.ts"),
      `export default { scenes: [{ key: "BootScene", scene: BootScene }] };`,
    );

    const scenesCmd = PHASER_CHECK_DECLARATIONS.commands.find(
      (c) => c.name === "phaser.scenes.validate",
    )!;
    const result = (await scenesCmd.execute(INPUT, kernelCtx(projectRoot))) as {
      data?: StackCheckData;
      exitCode: number;
      summary?: string;
    };

    expect(result.exitCode).toBe(0);
    expect(result.data?.command).toBe("phaser.scenes.validate");
    expect(result.data?.status).toBe("pass");
    expect(result.data?.violations).toHaveLength(0);
    expect(result.summary).toContain("phaser.scenes.validate");
  });

  it("command execute fails with violations on a broken fixture", async () => {
    await mkdir(join(projectRoot, "src", "scenes"), { recursive: true });
    await writeFile(join(projectRoot, "src", "scenes", "boot.ts"), "export class BootScene {}");
    await writeFile(join(projectRoot, "phaser.config.ts"), `export default { scenes: [] };`);

    const scenesCmd = PHASER_CHECK_DECLARATIONS.commands.find(
      (c) => c.name === "phaser.scenes.validate",
    )!;
    const result = (await scenesCmd.execute(INPUT, kernelCtx(projectRoot))) as {
      data?: StackCheckData;
      exitCode: number;
    };

    expect(result.exitCode).toBe(1);
    expect(result.data?.status).toBe("fail");
    expect(result.data?.violations[0]?.ruleId).toBe("PHASER-01");
  });

  it("runCheckGate aggregates all five checks into a HookResult", async () => {
    const logs: string[] = [];
    const ctx = {
      workspaceRoot: projectRoot,
      workpiecePath: projectRoot,
      logger: { info: (m: string) => logs.push(m), warn: () => {}, error: () => {} },
    };

    const result = await PHASER_CHECK_DECLARATIONS.runCheckGate(ctx);

    // Empty project: scenes check fails (no scenes), others pass.
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.includes("phaser.scenes.validate"))).toBe(true);
    expect(logs.some((l) => l.includes("checkGate"))).toBe(true);
  });

  it("AC-7: no stack path literals in src/checks top-level modules", async () => {
    // Forbidden literals are constructed dynamically so this test file itself
    // stays clean under a recursive scan. Scope: top-level validator modules —
    // test fixtures under __tests__/ legitimately reference path literals.
    const forbidden = [
      ["src", "scenes"].join("/"),
      ["phaser.config", "ts"].join("."),
      ["src", "assets", "manifest.yaml"].join("/"),
    ];
    const checksDir = join(import.meta.dirname, "..");
    const files = (await readdir(checksDir)).filter((f) => f.endsWith(".ts"));

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = await readFile(join(checksDir, file), "utf-8");
      for (const literal of forbidden) {
        expect(content.includes(literal), `${file} contains forbidden literal`).toBe(false);
      }
    }
  });
});
