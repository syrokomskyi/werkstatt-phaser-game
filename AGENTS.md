# AGENTS.md

## Проект

`@warpgogol/werkstatt-phaser-game` — плагин Werkstatt для стека Phaser 3 + Vite + Turborepo. Реализует контракт `werkstatt/plugin@1`: валидаторы сцен и ассетов, проверка размера бандла, сканер секретов, хук сборки через Vite, адаптеры деплоя на GitHub Pages и Cloudflare Pages, хук скаффолда и хук release evidence.

Приоритеты при изменениях:

1. Сохранить предсказуемость поведения валидаторов и хуков.
2. Не смешивать логику валидации с логикой деплоя или сборки.
3. Делать небольшие, типизированные и тестируемые изменения.
4. Не ломать контракт `werkstatt/plugin@1`, инварианты PHASER-01..05 и существующие команды.

## Стек

- TypeScript (strict)
- Phaser 3 (типы только; плагин не зависит от Phaser напрямую)
- Vite (хук сборки)
- pnpm

Используй существующие версии из `package.json`. Не добавляй зависимости, если задачу можно решить средствами Phaser, TypeScript или уже установленными пакетами.

## Команды

Перед работой проверь `package.json` и используй фактические scripts пакета.

```bash
pnpm install
pnpm run lint
pnpm run typecheck
pnpm run test
```

Перед завершением изменения обязательно выполни:

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
```

Если команды отсутствуют или завершаются ошибкой из-за окружения, сообщи об этом явно и не утверждай, что проверка прошла.

## Структура

```text
src/
  index.ts                          # Точка входа плагина — werkstattPhaserPlugin
  paths/
    phaser-paths.ts                 # Константы путей Phaser-стека
  invariants/
    phaser-invariants.ts            # Декларации инвариантов PHASER-01..05
  checks/
    assets-validate.ts              # phaser.assets.validate (PHASER-02)
    scenes-validate.ts              # phaser.scenes.validate (PHASER-01)
    bundle-validate.ts              # phaser.bundle.validate (PHASER-03)
    secret-scan.ts                  # phaser.secret.scan (PHASER-04)
    typescript-validate.ts          # phaser.typescript.validate (PHASER-05)
    index.ts                        # checkGate — запуск всех 5 валидаторов
    module.ts                       # Kernel module регистрации валидаторов
    __tests__/                      # Модульные тесты валидаторов
  build/
    vite-build.ts                   # hooks.build — запускает npx vite build
  deploy/
    github-pages.ts                 # deployAdapters["github-pages"]
    cloudflare-pages.ts             # deployAdapters["cloudflare-pages"]
    types.ts                        # Общий интерфейс DeployResult
    __tests__/                      # Тесты адаптеров деплоя
  onboarding/
    scaffold-project.ts             # hooks.scaffoldProject — бойлерплейт Phaser-проекта
    __tests__/                      # Тесты скаффолда
  release-evidence/
    phaser-evidence.ts              # hooks.releaseEvidence — SHA-256 хеши
    __tests__/                      # Тесты release evidence
```

Скаффолд генерирует:

```text
<project>/
  src/
    scenes/
      scene-keys.ts                 # SCENE_KEYS константы и SceneKey тип
      boot.ts                       # BootScene с типизированным жизненным циклом
    assets/
      manifest.yaml                 # Пустой манифест ассетов
    main.ts                         # new Phaser.Game(config) без as-cast
  phaser.config.ts                  # Phaser.Types.Core.GameConfig & { bundleBudget }
  vite.config.ts
  package.json
  tsconfig.json
```

Следуй уже существующей структуре репозитория, если она отличается от этой. Не перемещай файлы и не делай крупный рефакторинг без необходимости для задачи.

## Phaser-правила

- Каждая сцена в проекте, который валидируется плагином, отвечает за собственный жизненный цикл: `init`, `preload`, `create`, `update`.
- Валидатор `phaser.scenes.validate` проверяет, что каждая сцена в `src/scenes/` зарегистрирована в `phaser.config.ts`.
- Валидатор `phaser.assets.validate` проверяет, что каждый ассет из манифеста существует на диске и нет незарегистрированных ассетов.
- Ключи ассетов и сцен в генерируемом бойлерплейте объявляй как константы; не дублируй строковые литералы по коду.
- Не обращайся к приватным полям Phaser через `as any` в коде валидаторов или бойлерплейта.
- Предпочитай Phaser API вместо прямых изменений canvas или внутренних DOM-элементов в генерируемом коде.

## TypeScript-правила

- Не используй `any`; предпочитай явные типы, generics, type guards и `unknown`.
- Не подавляй ошибки TypeScript через `@ts-ignore` или `@ts-nocheck`.
- Экспортируй типы для границ модулей и публичных контрактов (команды, хуки, адаптеры).
- Держи логику валидаторов отдельно от логики деплоя и сборки.
- Не изменяй `tsconfig.json` и настройки сборки без явной причины и пояснения.

## TypeScript-first best practices (RFC-0933, PHASER-05)

При работе с Phaser-проектами агенты MUST следовать этим правилам:

1. **Нет `.js` файлов в `src/`.** Все исходники — `.ts`. Vite компилирует TypeScript.
2. **Нет `any`.** Используй типы Phaser (`Phaser.GameObjects.Sprite`, `Phaser.Physics.Arcade.Body`) или `unknown` с type guards.
3. **Нет `as any`.** Если тип Phaser не подходит — исправь использование или используй правильную type assertion.
4. **Нет `@ts-ignore` / `@ts-nocheck`.** Исправь ошибку типа. Эти директивы детектируются PHASER-05.
5. **`Phaser.Types.Core.GameConfig` для конфига.** Не создавай кастомный интерфейс конфига. Расширяй через intersection type если нужны кастомные поля.
6. **Ключи сцен как константы.** Все ключи сцен — в `src/scenes/scene-keys.ts` как `const` объект. Используй `SCENE_KEYS.SceneName` в конструкторе сцены и в конфиге. Не хардкоди строковые литералы.
7. **Типизированный жизненный цикл сцен.** Методы `preload`, `create`, `update` — с явными возвращаемыми типами (`: void`).
8. **Phaser input system.** Не используй `addEventListener` на `window` или `document`. Используй `this.input.on(Phaser.Input.Events.POINTER_DOWN, ...)`.
9. **Типы событий Phaser.** Используй `Phaser.Input.Events.*`, `Phaser.Scenes.Events.*`, `Phaser.Animations.Events.*` — не строковые литералы.
10. **Явный импорт Phaser.** `import Phaser from "phaser"` в каждом файле, использующем `Phaser.` namespace.
11. **Нет прямого DOM.** Используй `this.add.dom()`, `this.cameras.main`, `this.scale.resize()` — Phaser API. Не `document.getElementById` или прямой доступ к `canvas`.
12. **Prefab pattern.** Переиспользуемые объекты наследуют `Phaser.GameObjects.Container` (или `Sprite`, `Image`) с типизированными параметрами.

## Ассеты

- Валидатор `phaser.assets.validate` ожидает манифест ассетов в `src/assets/manifest.yaml`.
- Не переименовывай и не удаляй тестовые ассеты без проверки всех ссылок в тестах.
- Не добавляй большие бинарные файлы, лицензируемый контент или сторонние ассеты без явного запроса.

## Инварианты и check gate

| ID | Инвариант | Валидатор |
| --- | --- | --- |
| PHASER-01 | Каждая сцена в `src/scenes/` должна быть зарегистрирована в `phaser.config.ts` | `phaser.scenes.validate` |
| PHASER-02 | Каждый ассет из манифеста должен существовать и не должно быть незарегистрированных ассетов | `phaser.assets.validate` |
| PHASER-03 | Размер бандла (gzipped) не должен превышать бюджет (по умолчанию 5 МБ) | `phaser.bundle.validate` |
| PHASER-04 | Не должно быть хардкоженных API-ключей или секретов в исходниках | `phaser.secret.scan` |
| PHASER-05 | TypeScript-first: нет `.js` файлов, нет `any`, нет `@ts-ignore`, использовать `Phaser.Types.Core.GameConfig` и `SCENE_KEYS` | `phaser.typescript.validate` |

`checkGate` запускает все 5 валидаторов последовательно. Все должны пройти.

## Инъекция учётных данных

Адаптеры деплоя читают учётные данные из `systems/registry.yaml` channel config, не из переменных окружения:

- **github-pages**: `deploy.github.token`, `deploy.github.repo` (опционально)
- **cloudflare-pages**: `deploy.cloudflare.apiToken`, `deploy.cloudflare.accountId`, `deploy.cloudflare.projectName`

## Изменения и проверка

Перед завершением:

- Проверь затронутые импорты, ключи сцен и ключи ассетов в тестах.
- Убедись, что новая логика валидаторов не создаёт ложных срабатываний после рестарта сцены.
- Запусти `typecheck`, `lint` и `test`.
- Кратко перечисли изменённые файлы, выполненные проверки и известные ограничения.

## Нельзя без согласования

- Удалять тесты или ослаблять проверки, чтобы получить зелёную сборку.
- Менять lock-файл, зависимости, конфигурацию CI/CD или настройки деплоя без необходимости.
- Коммитить ключи API, `.env`-файлы, токены или приватные URL.
- Массово форматировать несвязанные файлы.
- Менять контракт плагина, инварианты или формат данных без предварительного плана.
- Добавлять новый plugin compatibility adapter или импортировать legacy plugin contract в движок.

## Техническая справка

### Контракт плагина

| Field | Value |
| --- | --- |
| `schema` | `werkstatt/plugin@1` |
| `id` | `werkstatt-phaser-game` |
| `profileId` | `phaser-turborepo` |
| `moduleLoaders` | `checks` |
| `deployAdapters` | `github-pages`, `cloudflare-pages` |
| `hooks` | `build`, `checkGate`, `releaseEvidence`, `scaffoldProject` |
| `paths` | `src` (contentDir), `dist` (distDir), `phaser.config.ts` + `src/main.ts` (entryPoints) |
| `invariants` | PHASER-01..05 |

### RFC-0855

All 25 packets (000–240) are completed. The checked-in `werkstatt/plugin@1` entry is a **legacy code fact** — it still loads and functions, but is architecturally superseded. Do not add a plugin compatibility adapter, import this package into the engine, or enable untrusted production artifacts.

### Скрипты

| Script        | Command                                   |
| ------------- | ----------------------------------------- |
| `lint`        | `pnpm exec eslint "src/**/*.ts"`          |
| `typecheck`   | `pnpm exec tsc -p tsconfig.json --noEmit` |
| `build`       | `pnpm exec tsc -p tsconfig.json --noEmit` |
| `build:check` | `pnpm exec tsc -p tsconfig.json --noEmit` |
| `test`        | `vitest run`                              |
| `test:watch`  | `vitest`                                  |

### Публикация

This package is published via repo-extract (RFC-0773). See `extract.config.yaml` for the extraction configuration. The package MUST NOT be published without operator approval.
