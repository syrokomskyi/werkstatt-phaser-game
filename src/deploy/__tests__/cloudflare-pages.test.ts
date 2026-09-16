import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createCloudflarePagesAdapter } from "../cloudflare-pages.ts";
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

describe("cloudflare-pages deploy adapter", () => {
  let workpiecePath: string;
  let calls: ToolSpec[];

  beforeEach(async () => {
    workpiecePath = await mkdtemp(join(tmpdir(), "phaser-cf-pages-"));
    calls = [];
  });

  afterEach(async () => {
    await rm(workpiecePath, { recursive: true, force: true });
  });

  it("fails when dist/ does not exist", () => {
    const adapter = createCloudflarePagesAdapter(recordingExecutor(calls));
    const result = adapter.deploy(workpiecePath, {
      apiToken: "cf_token",
      projectName: "my-game",
    });

    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("dist/ directory not found");
    expect(calls).toHaveLength(0);
  });

  it("fails when API token is not provided", async () => {
    await mkdir(join(workpiecePath, "dist"), { recursive: true });
    const adapter = createCloudflarePagesAdapter(recordingExecutor(calls));
    const result = adapter.deploy(workpiecePath, {
      apiToken: "",
      projectName: "my-game",
    });

    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("API token not provided");
  });

  it("fails when project name is not provided", async () => {
    await mkdir(join(workpiecePath, "dist"), { recursive: true });
    const adapter = createCloudflarePagesAdapter(recordingExecutor(calls));
    const result = adapter.deploy(workpiecePath, {
      apiToken: "cf_token",
      projectName: "",
    });

    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("project name not provided");
  });

  it("succeeds and calls wrangler pages deploy with correct args", async () => {
    await mkdir(join(workpiecePath, "dist"), { recursive: true });
    const adapter = createCloudflarePagesAdapter(recordingExecutor(calls));
    const result = adapter.deploy(workpiecePath, {
      apiToken: "cf_token",
      projectName: "my-game",
      branch: "main",
    });

    expect(result.success).toBe(true);
    expect(result.url).toBe("https://my-game.pages.dev");
    const last = calls.at(-1)!;
    expect(last.bin).toBe("npx");
    expect(last.args).toContain("wrangler");
    expect(last.args).toContain("pages");
    expect(last.args).toContain("deploy");
    expect(last.args).toContain("--project-name");
    expect(last.args).toContain("my-game");
    expect(last.args).toContain("--branch");
    expect(last.args).toContain("main");
  });

  it("passes credentials via env, not args", async () => {
    await mkdir(join(workpiecePath, "dist"), { recursive: true });
    const adapter = createCloudflarePagesAdapter(recordingExecutor(calls));
    adapter.deploy(workpiecePath, {
      apiToken: "cf_secret_token",
      accountId: "cf_account_123",
      projectName: "my-game",
    });

    const last = calls.at(-1)!;
    expect(last.env?.CLOUDFLARE_API_TOKEN).toBe("cf_secret_token");
    expect(last.env?.CLOUDFLARE_ACCOUNT_ID).toBe("cf_account_123");
    expect(last.args.some((a) => a.includes("cf_secret_token"))).toBe(false);
  });

  it("maps executor failure to a deploy failure", async () => {
    await mkdir(join(workpiecePath, "dist"), { recursive: true });
    const adapter = createCloudflarePagesAdapter(
      recordingExecutor(calls, { success: false, errors: ["exit 1"], failedAt: "exec" }),
    );
    const result = adapter.deploy(workpiecePath, {
      apiToken: "cf_token",
      projectName: "my-game",
    });

    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("Cloudflare Pages deploy failed");
  });
});
