/*
<MODULE_CONTRACT>
<purpose>readPhaserConfig — parses phaser.config.ts once into a syntactic model via
ts.createSourceFile (RFC-1100). Validators consume the model instead of re-reading
the file or regex-parsing config text.</purpose>

<non-goals>
  <item>Does not type-check — syntactic AST walk only, no ts.Program.</item>
  <item>Does not evaluate expressions — only literal and identifier forms are extracted.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1100: initial syntactic config model — sceneKeys, bundleBudget, usesGameConfigType, raw; replaces per-validator readFile + regex extraction of phaser.config.ts.</item>
  <item>RFC-1100: steps 3-6 — spec-driven checks, shared seams, scaffold table</item>
</CHANGE_SUMMARY>
*/

import ts from "typescript";
import { join } from "node:path";
import { readTextFile } from "@warpgogol/werkstatt-shared/share/walk-files";
import { PHASER_PATHS } from "../paths/phaser-paths.ts";

export interface PhaserConfigModel {
  /** Scene class names and scene keys registered via scene:/scenes: properties. */
  sceneKeys: string[];
  /** bundleBudget literal value, or null when absent. */
  bundleBudget: number | null;
  /** True when the config is typed as Phaser.Types.Core.GameConfig (incl. intersections). */
  usesGameConfigType: boolean;
  /** Raw file content — empty string when the file is missing. */
  raw: string;
}

const EMPTY_MODEL: PhaserConfigModel = {
  sceneKeys: [],
  bundleBudget: null,
  usesGameConfigType: false,
  raw: "",
};

export async function readPhaserConfig(projectRoot: string): Promise<PhaserConfigModel> {
  const raw = await readTextFile(join(projectRoot, PHASER_PATHS.phaserConfig));
  if (raw === null) {
    return EMPTY_MODEL;
  }

  const source = ts.createSourceFile(
    PHASER_PATHS.phaserConfig,
    raw,
    ts.ScriptTarget.Latest,
    true,
  );

  const sceneKeys = new Set<string>();
  let bundleBudget: number | null = null;
  let usesGameConfigType = false;

  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAssignment(node)) {
      const name = propertyName(node.name);
      if (name === "scene" || name === "scenes") {
        collectSceneKeys(node.initializer, sceneKeys);
      }
      if (name === "bundleBudget" && ts.isNumericLiteral(node.initializer)) {
        bundleBudget = Number.parseInt(node.initializer.text, 10);
      }
    }
    if (ts.isTypeReferenceNode(node) && entityNameText(node.typeName) === "Phaser.Types.Core.GameConfig") {
      usesGameConfigType = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  return { sceneKeys: [...sceneKeys], bundleBudget, usesGameConfigType, raw };
}

/** Identifier or string-literal property name text; undefined for computed keys. */
function propertyName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }
  return undefined;
}

/**
 * Collects registered scene names from a scene:/scenes: initializer:
 * identifiers (scene: [BootScene] or scene: BootScene) and key strings inside
 * object entries (scenes: [{ key: "Boot" }]), recursing into nested scene props.
 */
function collectSceneKeys(expr: ts.Expression, out: Set<string>): void {
  if (ts.isIdentifier(expr)) {
    out.add(expr.text);
    return;
  }
  if (ts.isArrayLiteralExpression(expr)) {
    for (const element of expr.elements) {
      collectSceneKeys(element, out);
    }
    return;
  }
  if (ts.isObjectLiteralExpression(expr)) {
    for (const prop of expr.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const name = propertyName(prop.name);
      if (name === "key" && ts.isStringLiteral(prop.initializer)) {
        out.add(prop.initializer.text);
      }
      if (name === "scene" || name === "scenes") {
        collectSceneKeys(prop.initializer, out);
      }
    }
  }
}

/** Dotted name text for a type reference, e.g. "Phaser.Types.Core.GameConfig". */
function entityNameText(name: ts.EntityName): string {
  return ts.isIdentifier(name)
    ? name.text
    : `${entityNameText(name.left)}.${name.right.text}`;
}
