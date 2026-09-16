import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createGitHubPagesAdapter } from "../github-pages.ts";
import type {
  ToolExecutor,
  ToolResult,
  ToolSpec,
} from "@warpgogol/werkstatt-shared/share/run-tool";

function recordingExecutor(
  calls: ToolSpec[],
  result: ToolResult = { success: true, stdout: "ok" },
): ToolExecutor {
  return (spec) => {
    calls.push(spec);
    return result;
  };
}

describe("github-pages deploy adapter", () => {
  let workpiecePath: string;
  let calls: ToolSpec[];

  beforeEach(async () => {
    workpiecePath = await mkdtemp(join(tmpdir(), "phaser-gh-pages-"));
    calls = [];
  });

  afterEach(async () => {
    await rm(workpiecePath, { recursive: true, force: true });
  });

  it("fails when dist/ does not exist", () => {
    const adapter = createGitHubPagesAdapter(recordingExecutor(calls));
    const result = adapter.deploy(workpiecePath, { token: "ghp_test" });

    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("dist/ directory not found");
    expect(calls).toHaveLength(0);
  });

  it("fails when token is not provided", async () => {
    await mkdir(join(workpiecePath, "dist"), { recursive: true });
    const adapter = createGitHubPagesAdapter(recordingExecutor(calls));
    const result = adapter.deploy(workpiecePath, { token: "" });

    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("GitHub token not provided");
  });

  it("succeeds and calls gh-pages with correct args", async () => {
    await mkdir(join(workpiecePath, "dist"), { recursive: true });
    const adapter = createGitHubPagesAdapter(recordingExecutor(calls));
    const result = adapter.deploy(workpiecePath, {
      token: "ghp_testtoken",
      repo: "user/repo",
    });

    expect(result.success).toBe(true);
    expect(result.url).toContain("github.io");
    expect(calls.length).toBeGreaterThan(0);
    const last = calls.at(-1)!;
    expect(last.bin).toBe("npx");
    expect(last.args).toContain("gh-pages");
    expect(last.args).toContain("-d");
    expect(last.args).toContain("dist");
    expect(last.env?.GH_TOKEN).toBe("ghp_testtoken");
  });

  it("passes branch and repo URL when configured", async () => {
    await mkdir(join(workpiecePath, "dist"), { recursive: true });
    const adapter = createGitHubPagesAdapter(recordingExecutor(calls));
    adapter.deploy(workpiecePath, {
      token: "ghp_testtoken",
      repo: "user/repo",
      branch: "main",
    });

    const last = calls.at(-1)!;
    expect(last.args).toContain("-b");
    expect(last.args).toContain("main");
    expect(last.args).toContain("-r");
    expect(last.args.some((a) => a.includes("x-access-token:ghp_testtoken@github.com/user/repo"))).toBe(true);
  });

  it("maps executor failure to a deploy failure", async () => {
    await mkdir(join(workpiecePath, "dist"), { recursive: true });
    const adapter = createGitHubPagesAdapter(
      recordingExecutor(calls, { success: false, errors: ["exit 1"], failedAt: "exec" }),
    );
    const result = adapter.deploy(workpiecePath, { token: "ghp_testtoken" });

    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("GitHub Pages deploy failed");
  });
});
