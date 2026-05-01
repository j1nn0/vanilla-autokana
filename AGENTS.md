# AGENTS.md

## Basic Rules

- All user-facing responses must be in Japanese.
- Use MCP `context7` and `serena` proactively when researching documentation, exploring the codebase, and making precise edits.

## Repository Overview

- Single-package TypeScript library: `@j1nn0/vanilla-autokana`
- Public entrypoint: `src/index.ts`. Exports `bind(...)`, `AutoKana`, and `AutoKanaOption`.
- Main implementation: `src/AutoKana.ts`
- Published type declarations: `types/autokana.d.ts`
- Build artifacts: `dist/autokana.umd.js` and `dist/autokana.es.js`. Do not edit `dist/` by hand.

## Important Commands

- Development requirements: `node >=24`, `pnpm >=10`
- Install dependencies: `pnpm install`
- Lint: `pnpm run lint`
- Typecheck: `pnpm run typecheck`
- Full test suite: `pnpm run test`
- Single test file: `pnpm exec vitest run __tests__/AutoKana.test.ts`
- Coverage: `pnpm run test:coverage`
- Build: `pnpm run build`
- Full verification: `pnpm run ci` (`lint -> typecheck -> test:coverage -> build`)
- Format: `pnpm run format` (rewrites `src/` only)

## Implementation Gotchas

- `bind()` / `new AutoKana(...)` accept element IDs with or without `#`, or an `Element` instance.
- Throw `Error` when the `name` element cannot be found.
- `furigana` is optional. Do not assume an output input always exists.
- `katakana` supports only `false | 'full' | 'half'`. In `'half'` mode, full-width spaces are normalized to half-width spaces.
- Conversion detection is polling-based via `checkInterval` (default `30` ms) and tied to focus/blur interval management. Changes here are likely to cause behavioral drift.
- For Vue/React controlled inputs, do not rely on directly mutating the output input's `value`; preserve the README-documented `getFurigana()` usage model.

## Types And Tests

- `tsconfig.json` includes only `src` and `__tests__`. Drift in `types/autokana.d.ts` is not caught by `pnpm run typecheck`, so sync it manually when the public API changes.
- Tests run in `jsdom`.
- `__tests__/AutoKana.test.ts` directly asserts internal `AutoKana` fields and methods. When behavior changes, review existing test expectations, not just public API coverage.

## Skills

- Repo-local skills live under `.agents/skills/`. Load the relevant one as soon as you enter that domain.
- `test-driven-development`: before feature work, bug fixes, or refactors in `AutoKana`.
- `verification-before-completion`: before reporting completion; use at least `pnpm run ci` as evidence.
- `typescript-advanced-types`: when changing public types or `types/autokana.d.ts`.

## Recommended Workflow

1. Make changes in `src/` first; treat it as the source of truth.
2. If the public API changes, sync `types/autokana.d.ts`.
3. If behavior changes, update or add tests in `__tests__/AutoKana.test.ts`.
4. Run `pnpm run ci` before finishing.
