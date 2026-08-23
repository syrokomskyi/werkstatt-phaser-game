# @warpgogol/werkstatt-phaser-game

[Українська](README.uk.md) | English

Werkstatt plugin for the Phaser 3 + Vite + Turborepo stack. Implements the `werkstatt/plugin@1` contract: scene and asset validators, bundle size check, secret scanner, Vite build hook, deploy adapters for GitHub Pages and Cloudflare Pages, project scaffold hook, and release evidence generation.

---

## What this package does

This is a **stack plugin** for the [Werkstatt](https://www.npmjs.com/package/@warpgogol/werkstatt) engine. It provides everything the engine needs to manage a Phaser 3 browser game project:

- **4 validators** (scene registration, asset integrity, bundle size, secret scan)
- **Build hook** (runs `vite build`)
- **2 deploy adapters** (GitHub Pages, Cloudflare Pages)
- **Scaffold hook** (generates Phaser project boilerplate)
- **Release evidence hook** (SHA-256 hashes for release integrity)

You don't use this package on its own — it is loaded by the Werkstatt engine when you create a project with the `phaser-turborepo` profile.

---

## Installation

This package is installed as a devDependency alongside the Werkstatt engine:

```sh
pnpm add -D @warpgogol/werkstatt @warpgogol/werkstatt-phaser-game
```

> **Note for agents:** When scaffolding a new project with `forge create --profile phaser-turborepo`, always install the engine and this plugin after the scaffold completes. The `forge.yaml` bindings reference commands from these packages, and they will fail if the packages are not installed.

---

## How it fits into the Werkstatt ecosystem

| Package | Role |
| --- | --- |
| `@warpgogol/forge` | Governance layer — skills, RFC/ADR workflows, CLI, project scaffolding |
| `@warpgogol/werkstatt` | Runtime engine — missions, releases, deployment, certification, Bordbuch |
| `@warpgogol/werkstatt-shared` | Shared infrastructure — checks, integration, ontology, passport |
| `@warpgogol/werkstatt-phaser-game` | **This package** — Phaser stack plugin for browser game projects |

**Forge** creates the project and sets up governance. **Werkstatt** manages the lifecycle (missions, releases, deployment). **This plugin** provides Phaser-specific validators, build hooks, and deploy adapters that the engine calls during the pipeline.

---

## Validators

The plugin registers 4 kernel commands that run during the check gate:

| Command | Invariant | What it checks |
| --- | --- | --- |
| `phaser.scenes.validate` | PHASER-01 | Every scene in `src/scenes/` is registered in `phaser.config.ts` |
| `phaser.assets.validate` | PHASER-02 | Every asset from the manifest exists on disk and no unregistered assets |
| `phaser.bundle.validate` | PHASER-03 | Bundle size (gzipped) does not exceed the budget (default 5 MB) |
| `phaser.secret.scan` | PHASER-04 | No hardcoded API keys or secrets in game source |

`checkGate` runs all 4 validators sequentially. All must pass.

---

## Deploy adapters

| Adapter | Target | Credentials source |
| --- | --- | --- |
| `github-pages` | GitHub Pages | `deploy.github.token`, `deploy.github.repo` from `systems/registry.yaml` |
| `cloudflare-pages` | Cloudflare Pages | `deploy.cloudflare.apiToken`, `deploy.cloudflare.accountId`, `deploy.cloudflare.projectName` from `systems/registry.yaml` |

Credentials are read from the system registry, not from environment variables.

---

## Hooks

| Hook | What it does |
| --- | --- |
| `build` | Runs `npx vite build` to produce the game bundle |
| `checkGate` | Runs all 4 validators sequentially |
| `releaseEvidence` | Generates SHA-256 hashes for release integrity verification |
| `scaffoldProject` | Generates Phaser project boilerplate (scenes, config, assets manifest) |

---

## Path conventions

| Path | Value |
| --- | --- |
| Content directory | `src` |
| Distribution directory | `dist` |
| Entry points | `phaser.config.ts`, `src/main.ts` |
| Scenes directory | `src/scenes` |
| Assets directory | `src/assets` |
| Asset manifest | `src/assets/manifest.yaml` |

---

## Programmatic API

```ts
import { werkstattPhaserPlugin } from "@warpgogol/werkstatt-phaser-game";

// Register the plugin with the Werkstatt engine
engine.registerPlugin(werkstattPhaserPlugin);
```

The plugin exports a single `WerkstattPlugin` object with `profileId: "phaser-turborepo"`. The engine discovers it automatically when the package is installed.

### Subpath exports

| Export | What it provides |
| --- | --- |
| `@warpgogol/werkstatt-phaser-game` | Plugin entry point (`werkstattPhaserPlugin`) |
| `@warpgogol/werkstatt-phaser-game/paths` | Phaser path constants |
| `@warpgogol/werkstatt-phaser-game/checks` | Check gate runner |
| `@warpgogol/werkstatt-phaser-game/checks/module` | Kernel module with validator registrations |
| `@warpgogol/werkstatt-phaser-game/invariants` | PHASER-01..04 invariant declarations |
| `@warpgogol/werkstatt-phaser-game/deploy/types` | Deploy adapter type definitions |
| `@warpgogol/werkstatt-phaser-game/build` | Vite build hook |
| `@warpgogol/werkstatt-phaser-game/release-evidence` | Release evidence hook |

---

## Architecture

| Directory | Purpose |
| --- | --- |
| `src/index.ts` | Plugin entry point — exports `werkstattPhaserPlugin` |
| `src/paths/` | Phaser path conventions (`src`, `dist`, entry points) |
| `src/invariants/` | PHASER-01..04 invariant declarations |
| `src/checks/` | 4 validators + check gate runner + kernel module |
| `src/build/` | Vite build hook |
| `src/deploy/` | GitHub Pages and Cloudflare Pages deploy adapters |
| `src/onboarding/` | Project scaffold hook (boilerplate generation) |
| `src/release-evidence/` | Release evidence hook (SHA-256 hashes) |

---

## Publishing to npm

This package is published to the npm registry as `@warpgogol/werkstatt-phaser-game`. Publishing is automated via GitHub Actions CI.

### How it works

1. The source lives in the [warpgogol/werkstatt](https://github.com/syrokomskyi/werkstatt) monorepo under `packages/werkstatt-phaser-game/`.
2. [`@warpgogol/repo-extract`](https://github.com/syrokomskyi/repo-extract) extracts the package into the standalone [syrokomskyi/werkstatt-phaser-game](https://github.com/syrokomskyi/werkstatt-phaser-game) repository, flattening it to repo root and stripping workspace dependencies.
3. The generated GitHub Actions CI workflow runs on every push to `main`: lint → typecheck → build → test → `npm publish --provenance --access public`.
4. The `NPM_TOKEN` secret must be set in the [repository settings](https://github.com/syrokomskyi/werkstatt-phaser-game/settings/secrets/actions).

### Triggering a new release

From the werkstatt monorepo root:

```sh
# 1. Bump the version in packages/werkstatt-phaser-game/package.json
# 2. Run the extraction (extracts + commits + pushes to github.com:syrokomskyi/werkstatt-phaser-game.git)
pnpm exec repo-extract --config packages/werkstatt-phaser-game/extract.config.yaml --verbose

# 3. CI picks up the push and publishes to npm automatically
```

After CI completes, verify the new version on [npmjs.com/package/@warpgogol/werkstatt-phaser-game](https://www.npmjs.com/package/@warpgogol/werkstatt-phaser-game).

---

## License

Apache-2.0
