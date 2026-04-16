# AGENTS.md

Agent instructions for working in this repository.

## Project Snapshot

- Library: vanilla JavaScript furigana helper.
- Package: `@j1nn0/vanilla-autokana`.
- Entry point: [src/index.js](src/index.js) (`bind(name, furigana, option)`).
- Core logic: [src/AutoKana.js](src/AutoKana.js).
- Public types: [types/autokana.d.ts](types/autokana.d.ts).

## Fast Start Commands

- Install: `pnpm install`
- Test: `pnpm run test`
- Lint: `pnpm run lint`
- Format: `pnpm run format`
- Build: `pnpm run build`
- Release pipeline: `pnpm run publish`

## Ground Rules For Changes

- Keep source-of-truth in `src/` and `types/`; do not hand-edit generated `dist/` outputs.
- Preserve the public API shape from [src/index.js](src/index.js) and [types/autokana.d.ts](types/autokana.d.ts).
- Keep behavior aligned with existing tests in [**tests**/AutoKana.test.js](__tests__/AutoKana.test.js); add tests for behavior changes.
- Use existing style (JSDoc comments, current lint/format setup).

## Behavior Notes That Prevent Regressions

- `bind()` accepts either element IDs (with or without `#`) or `Element` instances.
- DOM elements must exist before binding (use `DOMContentLoaded` in examples/apps).
- `katakana` option supports exactly: `false`, `'full'`, `'half'`.
- In `'half'` mode, full-width spaces are normalized to half-width spaces in furigana output.
- Conversion detection relies on polling (`checkInterval`, default 30ms) and conversion-state transitions in `checkValue()` / `checkConvert()`.

## Where To Read More (Link, Do Not Duplicate)

- Japanese usage and framework caveats: [README.md](README.md)
- English usage: [README_en.md](README_en.md)
- Build config: [vite.config.js](vite.config.js)
- Test config: [vitest.config.js](vitest.config.js)
- Recent release notes: [CHANGELOG](CHANGELOG)

## Typical Safe Workflow

1. Make minimal change in [src/AutoKana.js](src/AutoKana.js) or [src/index.js](src/index.js).
2. Update [types/autokana.d.ts](types/autokana.d.ts) if public API changed.
3. Add or update tests in [**tests**/AutoKana.test.js](__tests__/AutoKana.test.js).
4. Run `pnpm run lint && pnpm run test && pnpm run build`.
