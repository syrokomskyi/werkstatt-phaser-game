# @warpgogol/werkstatt-phaser-game

Українська | [English](README.md)

Плагін Werkstatt для стека Phaser 3 + Vite + Turborepo. Реалізує контракт `werkstatt/plugin@1`: валідатори сцен і ассетів, перевірка розміру бандла, сканер секретів, хук збірки через Vite, адаптери деплою на GitHub Pages та Cloudflare Pages, хук скаффолда проєкту та генерація release evidence.

---

## Що робить цей пакет

Це **стек-плагін** для рушія [Werkstatt](https://www.npmjs.com/package/@warpgogol/werkstatt). Він надає все, що рушію потрібно для управління проєктом браузерної гри на Phaser 3:

- **4 валідатори** (реєстрація сцен, цілісність ассетів, розмір бандла, скан секретів)
- **Хук збірки** (запускає `vite build`)
- **2 адаптери деплою** (GitHub Pages, Cloudflare Pages)
- **Хук скаффолда** (генерує бойлерплейт Phaser-проєкту)
- **Хук release evidence** (SHA-256 хеші для цілісності релізу)

Цей пакет не використовується самостійно — його завантажує рушій Werkstatt під час створення проєкту з профілем `phaser-turborepo`.

---

## Встановлення

Пакет встановлюється як devDependency разом з рушієм Werkstatt:

```sh
pnpm add -D @warpgogol/werkstatt @warpgogol/werkstatt-phaser-game
```

> **Примітка для агентів:** Після створення проєкту командою `forge create --profile phaser-turborepo` завжди встановлюйте рушій та цей плагін. Прив'язки в `forge.yaml` посилаються на команди з цих пакунків, і вони не працюватимуть, якщо пакунки не встановлені.

---

## Як це вписується в екосистему Werkstatt

| Пакет | Роль |
| --- | --- |
| `@warpgogol/forge` | Шар управління — навички, RFC/ADR робочі процеси, CLI, скаффолд проєктів |
| `@warpgogol/werkstatt` | Рушій runtime — місії, релізи, розгортання, сертифікація, Bordbuch |
| `@warpgogol/werkstatt-shared` | Спільна інфраструктура — перевірки, інтеграція, онтологія, паспорт |
| `@warpgogol/werkstatt-phaser-game` | **Цей пакет** — плагин стека Phaser для проєктів браузерних ігор |

**Forge** створює проєкт і налаштовує управління. **Werkstatt** керує життєвим циклом (місії, релізи, розгортання). **Цей плагін** надає специфічні для Phaser валідатори, хуки збірки та адаптери деплою, які рушій викликає під час пайплайну.

---

## Валідатори

Плагін реєструє 4 kernel-команди, які запускаються під час check gate:

| Команда | Інваріант | Що перевіряє |
| --- | --- | --- |
| `phaser.scenes.validate` | PHASER-01 | Кожна сцена в `src/scenes/` зареєстрована в `phaser.config.ts` |
| `phaser.assets.validate` | PHASER-02 | Кожен ассет з маніфесту існує на диску та немає незареєстрованих ассетів |
| `phaser.bundle.validate` | PHASER-03 | Розмір бандла (gzipped) не перевищує бюджет (за замовчуванням 5 МБ) |
| `phaser.secret.scan` | PHASER-04 | Немає хардкожених API-ключів або секретів у вихідному коді гри |

`checkGate` запускає всі 4 валідатори послідовно. Усі мають пройти.

---

## Адаптери деплою

| Адаптер | Ціль | Джерело облікових даних |
| --- | --- | --- |
| `github-pages` | GitHub Pages | `deploy.github.token`, `deploy.github.repo` з `systems/registry.yaml` |
| `cloudflare-pages` | Cloudflare Pages | `deploy.cloudflare.apiToken`, `deploy.cloudflare.accountId`, `deploy.cloudflare.projectName` з `systems/registry.yaml` |

Облікові дані зчитуються з системного реєстру, а не з змінних оточення.

---

## Хуки

| Хук | Що робить |
| --- | --- |
| `build` | Запускає `npx vite build` для створення бандла гри |
| `checkGate` | Запускає всі 4 валідатори послідовно |
| `releaseEvidence` | Генерує SHA-256 хеші для перевірки цілісності релізу |
| `scaffoldProject` | Генерує бойлерплейт Phaser-проєкту (сцени, конфіг, маніфест ассетів) |

---

## Конвенції шляхів

| Шлях | Значення |
| --- | --- |
| Директорія контенту | `src` |
| Директорія дистрибуції | `dist` |
| Точки входу | `phaser.config.ts`, `src/main.ts` |
| Директорія сцен | `src/scenes` |
| Директорія ассетів | `src/assets` |
| Маніфест ассетів | `src/assets/manifest.yaml` |

---

## Програмний API

```ts
import { werkstattPhaserPlugin } from "@warpgogol/werkstatt-phaser-game";

// Зареєструвати плагін у рушії Werkstatt
engine.registerPlugin(werkstattPhaserPlugin);
```

Плагін експортує єдиний об'єкт `WerkstattPlugin` з `profileId: "phaser-turborepo"`. Рушій виявляє його автоматично, коли пакет встановлено.

### Subpath-експорти

| Експорт | Що надає |
| --- | --- |
| `@warpgogol/werkstatt-phaser-game` | Точка входу плагіна (`werkstattPhaserPlugin`) |
| `@warpgogol/werkstatt-phaser-game/paths` | Константи шляхів Phaser |
| `@warpgogol/werkstatt-phaser-game/checks` | Runner check gate |
| `@warpgogol/werkstatt-phaser-game/checks/module` | Kernel-модуль з реєстраціями валідаторів |
| `@warpgogol/werkstatt-phaser-game/invariants` | Декларації інваріантів PHASER-01..04 |
| `@warpgogol/werkstatt-phaser-game/deploy/types` | Визначення типів адаптера деплою |
| `@warpgogol/werkstatt-phaser-game/build` | Хук збірки Vite |
| `@warpgogol/werkstatt-phaser-game/release-evidence` | Хук release evidence |

---

## Архітектура

| Директорія | Призначення |
| --- | --- |
| `src/index.ts` | Точка входу плагіна — експортує `werkstattPhaserPlugin` |
| `src/paths/` | Конвенції шляхів Phaser (`src`, `dist`, точки входу) |
| `src/invariants/` | Декларації інваріантів PHASER-01..04 |
| `src/checks/` | 4 валідатори + runner check gate + kernel-модуль |
| `src/build/` | Хук збірки Vite |
| `src/deploy/` | Адаптери деплою GitHub Pages та Cloudflare Pages |
| `src/onboarding/` | Хук скаффолда проєкту (генерація бойлерплейту) |
| `src/release-evidence/` | Хук release evidence (SHA-256 хеші) |

---

## Публікація в npm

Цей пакет публікується в реєстр npm як `@warpgogol/werkstatt-phaser-game`. Публікація автоматизована через GitHub Actions CI.

### Як це працює

1. Вихідний код знаходиться в монорепозиторії [warpgogol/werkstatt](https://github.com/syrokomskyi/werkstatt) у `packages/werkstatt-phaser-game/`.
2. [`@warpgogol/repo-extract`](https://github.com/syrokomskyi/repo-extract) витягує пакет у автономний репозиторій [syrokomskyi/werkstatt-phaser-game](https://github.com/syrokomskyi/werkstatt-phaser-game), вирівнюючи його до кореня репозиторію та видаляючи залежності робочого простору.
3. Згенерований GitHub Actions CI-воркфлоу запускається при кожному пуші в `main`: lint → typecheck → build → test → `npm publish --provenance --access public`.
4. Секрет `NPM_TOKEN` має бути встановлений у [налаштуваннях репозиторію](https://github.com/syrokomskyi/werkstatt-phaser-game/settings/secrets/actions).

### Запуск нового релізу

З кореня монорепозиторію werkstatt:

```sh
# 1. Підняти версію в packages/werkstatt-phaser-game/package.json
# 2. Запустити екстракцію (витягує + комітить + пушить в github.com:syrokomskyi/werkstatt-phaser-game.git)
pnpm exec repo-extract --config packages/werkstatt-phaser-game/extract.config.yaml --verbose

# 3. CI підхоплює пуш і публікує в npm автоматично
```

Після завершення CI перевірте нову версію на [npmjs.com/package/@warpgogol/werkstatt-phaser-game](https://www.npmjs.com/package/@warpgogol/werkstatt-phaser-game).

---

## Ліцензія

Apache-2.0
