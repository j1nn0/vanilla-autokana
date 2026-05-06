# Learnings

## CI Workflow Creation

- Created `.github/workflows/ci.yml` for GitHub Actions
- Uses `corepack enable` before `pnpm install` (as project uses `packageManager` field in package.json)
- Cache via `actions/setup-node@v4` with `cache: 'pnpm'`
- Steps match `package.json:scripts.ci`: lint → typecheck → test:coverage → build
- Coverage artifact uploaded via `actions/upload-artifact@v4`

## 2026-05-06: Renamed CHANGELOG → CHANGELOG.md
- Used `git mv CHANGELOG CHANGELOG.md` for proper git tracking
- Verified: content identical (`diff` zero exit), git status shows `R` (rename)
- GitHub will now render the file as formatted Markdown

## 2026-05-06: Branch Coverage Tests (Wave 1 - Test Improvements)

- Added 3 tests under `describe('uncovered branches', ...)` in `__tests__/AutoKana.test.ts`
- **L34 (SVGElement)**: `document.createElementNS('http://www.w3.org/2000/svg', 'svg')` creates an `Element` that is NOT `HTMLElement`. Passing it to constructor triggers `requireElement` → `Error`. Test expects `toThrow('Element not found')`.
- **L293 (removeString for-loop)**: When `ignoreString` is NOT a substring of `newInput` but they share prefix chars, the for-loop at L291-294 matches and removes those chars. Set `ignoreString = 'あいう'`, input `'あいか'`, result `'か'`.
- **L306-307 (checkConvert with non-kana)**: Requires `values.length === input.length` AND `input` has non-kana chars → triggers `onConvert()`. Sequence: process 'や' (values=['や']), then process 'a' (same length, non-kana) → `Math.abs(1-0) <= 1` falls to else-if → `1===1`, `'や'!=='a'`, `'a'.match(kanaExtractionPattern)` true → onConvert fires.
- Result: Branch coverage improved from 83.33% (50/60) → 91.66% (55/60). All 50 tests pass (47 original + 3 new).
- Key pattern: For `removeString` to hit the else branch, `ignoreString` must be non-empty; otherwise `''.indexOf('') === 0` hits the first branch.

## 2026-05-06: README_en.md Sync with README.md (Japanese master)

- Japanese README is the source of truth. English README was missing several sections.
- **Added to Usage section**: 4 bullet points explaining bind() arguments, CSS selector support, DOMContentLoaded recommendation, defer attribute recommendation.
- **Added to Options section**: `AutoKana.bind(name, furigana, option)` signature line for clarity.
- **Updated Vue.js example**: Replaced simplified Vue 3 functional example with full Options API template matching Japanese README (includes labels, confirmation section, `getFurigana()` usage).
- **Updated React.js example**: Replaced functional component with hooks example with class component matching Japanese README structure.
- English README now has 177 lines (same as Japanese README at 177 lines), with all sections present.
- Technical terms kept consistent: "furigana", "hiragana", "katakana", "full-width", "half-width".

## 2026-05-06: Type Safety & Visibility Improvements (Wave 2)

### Changes to `src/AutoKana.ts`
- **`Bindable` type narrowed**: `string | Element` → `string | HTMLElement` — prevents passing non-HTML elements (e.g., SVGElement) at compile time.
- **`toggle()` signature improved**: `event?: Event` → `event?: { target: { checked: boolean } }` — uses an intersection type (not `Pick<Event, 'target'>`) to avoid naming conflicts and narrow to checkbox-like events only.
- **8 properties made `private`**: `baseKana`, `furigana`, `isComposing`, `ignoreString`, `input`, `values`, `elName`, `elFurigana`.
- **`registerEvents()` made `private`**: internal event wiring is not part of the public API.
- **`isActive` and `option` remain public** (along with all public methods).

### Changes to `src/index.ts`
- Imported and re-exported `Bindable` type so consumers can reference it.
- Updated `bind()` parameters to use `Bindable` instead of inline `string | Element`.

### Changes to `__tests__/AutoKana.test.ts`
- Added `// @ts-expect-error - accessing private property for test verification` above all 63 accesses to newly-private properties.
- Removed `as unknown as Event` casts from `toggle()` tests (now unnecessary with the narrowed signature).
- Changed `querySelector` casts from `as Element` to `as HTMLElement` in the "pass elements" test.
- Added `// @ts-expect-error` above the SVGElement constructor test since `SVGElement` is no longer assignable to `Bindable`.

### Verification
- `pnpm run typecheck`: 0 errors.
- `pnpm run test:coverage`: all 50 tests pass, branch coverage 93.1% (≥ 85% required).
- `pnpm run lint`: 0 warnings, 0 errors.

## 2026-05-06: JSDoc Documentation & Type Exports (T7)

### Changes to `src/AutoKana.ts`
- Added JSDoc comments to 6 public methods following the existing `bind()` pattern:
  - **`getFurigana()`**: `@returns The current furigana string.`
  - **`start()`**: `Resume auto-kana tracking.`
  - **`stop()`**: `Pause auto-kana tracking.`
  - **`toggle(event?)`**: `@param event Optional checkbox change event. When provided, uses the checked state of the target.`
  - **`initializeValues()`**: `Reset all internal state (base kana, furigana, composing flag, etc.).`
  - **`destroy()`**: `Remove all event listeners (blur, focus, compositionstart, compositionend, input) from the name element.`
- Exported `KatakanaOption` type: `export type { ... , KatakanaOption }` (was defined but not exported).

### Changes to `src/index.ts`
- Imported `KatakanaOption` from `./AutoKana`.
- Re-exported `KatakanaOption` type.
- Now exports: `AutoKana`, `bind()`, `AutoKanaOption`, `Bindable`, `KatakanaOption`.

### Verification
- `pnpm run typecheck`: 0 errors.
- `pnpm run test:coverage`: all 50 tests pass (50/50), branch coverage 93.1%.
- `pnpm run build`: succeeds. JSDoc visible in `dist/AutoKana.d.ts` for all 6 methods.
- `dist/index.d.ts` includes `KatakanaOption` in type exports.

## 2026-05-06: F3 Real Manual QA (Final Verification)

### Clean State
- `pnpm install`: clean, deps up to date.
- `pnpm run ci`: all 4 steps pass (lint 0/0, typecheck 0 errors, tests 50/50 pass at 93.1% branch cov, build successful).

### Deliverable Verification (8/8 PASS)
- **T1 CI Workflow**: YAML valid, triggers (push+PR to main), Node 24, all steps in order.
- **T2 katakanaMap**: 87 entries, imported via `import { fullToHalfKatakanaMap } from './katakanaMap'`, no inline def remains.
- **T3 Branch Tests**: 50 tests (47+3), 93.1% branch coverage (≥85% threshold).
- **T4 Package.json**: `exports` field present (import/require/types), `sideEffects: false`, `provenance: true`, legacy fields maintained.
- **T5 CHANGELOG.md**: exists, old CHANGELOG gone, content preserved.
- **T6 Private Properties**: External access blocked (TS2341), `isActive`/`option` still public, 64 `@ts-expect-error` in tests.
- **T7 README_en.md**: CSS selector (2), getFurigana (3), Vue (2), React (2), katakana (8) references all present.
- **T8 JSDoc**: 6 public methods documented, 16 JSDoc lines, `@returns`/`@param` in `.d.ts`, `Bindable` exported.

### Key Findings
- Python YAML module not available; validated CI YAML via Node structural checks instead.
- tsconfig only includes `src`, `__tests__`, etc. — tests for external private access must be placed in `__tests__/`.
- `katakanaMap` has 87 entries (not 89 as estimated in plan).
- All evidence saved to `.sisyphus/evidence/final-qa/` (7 evidence files + 1 final report).
