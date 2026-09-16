/*
<MODULE_CONTRACT>
<purpose>phaser.secret.scan — PHASER-04 secret scan enforcement over game source files.</purpose>

<non-goals>
  <item>Does not modify files — read-only validator.</item>
  <item>Does not use external tools — regex-based scan only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1100: rewritten as pure checkSecrets() on shared seams — walkFiles/readTextFiles for source discovery; command envelope moved to PHASER_CHECKS spec.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
  <item>RFC-1100: steps 3-6 — spec-driven checks, shared seams, scaffold table</item>
</CHANGE_SUMMARY>
*/

import { join } from "node:path";
import { readTextFiles, walkFiles } from "@warpgogol/werkstatt-shared/share/walk-files";
import type { StackCheckViolation } from "@warpgogol/werkstatt-shared/share/stack-checks";
import { PHASER_PATHS } from "../paths/phaser-paths.ts";

const SECRET_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  {
    pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["']([A-Za-z0-9_\-]{20,})["']/gi,
    label: "Hardcoded API key",
  },
  {
    pattern: /(?:secret|token|password|passwd)\s*[:=]\s*["']([A-Za-z0-9_\-]{8,})["']/gi,
    label: "Hardcoded secret/token/password",
  },
  {
    pattern: /(?:AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    label: "AWS access key pattern",
  },
  {
    pattern: /ghp_[A-Za-z0-9]{36}/g,
    label: "GitHub personal access token",
  },
  {
    pattern: /sk_live_[A-Za-z0-9]{24,}/g,
    label: "Stripe secret key",
  },
  {
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    label: "Private key block",
  },
];

export async function checkSecrets(projectRoot: string): Promise<StackCheckViolation[]> {
  const violations: StackCheckViolation[] = [];
  const srcDir = join(projectRoot, PHASER_PATHS.srcDir);
  const files = await walkFiles(srcDir, {
    filter: (rel) => rel.endsWith(".ts") && !rel.endsWith(".d.ts"),
  });
  const contents = await readTextFiles(srcDir, files);

  for (const relPath of files) {
    const content = contents.get(relPath);
    if (content === undefined) continue;
    const relFile = `${PHASER_PATHS.srcDir}/${relPath}`;
    const lines = content.split("\n");

    let inBlockComment = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();
      if (inBlockComment) {
        if (trimmed.includes("*/")) {
          inBlockComment = false;
        }
        continue;
      }
      if (trimmed.startsWith("/*")) {
        if (!trimmed.includes("*/")) {
          inBlockComment = true;
        }
        continue;
      }
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) {
        continue;
      }
      for (const { pattern, label } of SECRET_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          violations.push({
            ruleId: "PHASER-04",
            file: relFile,
            line: i + 1,
            message: `${label} detected in source`,
          });
          break;
        }
      }
    }
  }

  return violations;
}
