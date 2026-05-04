# Learnings — ime-composition-refactor

## Conventions
- Event handlers as arrow function properties (private blurHandler = () => {})
- Tests use `setup()` helper to inject HTML into jsdom
- TDD: RED → GREEN → REFACTOR

## Patterns
- `setup('<input name="name" id="name"><input name="furigana" id="furigana">')` for test DOM
- `new Event('focus')` / `new Event('blur')` for event dispatch in tests
- `describe(name, () => {})` blocks for test grouping

## Project Info
- TypeScript, vitest + jsdom, UMD + ES + d.ts build via Vite
- pnpm >= 10, node >= 24
- CI: lint → typecheck → test:coverage → build

## Baseline (2026-05-05)
- CI: Pass (exit 0) — lint 0 errors, typecheck clean, 36/36 tests pass, build succeeds
- Test count: 36 (not ~25 as initially estimated)
- Coverage: Statements 92.42%, Branches 75.71%, Functions 100%, Lines 93.54%
- All coverage thresholds met (≥70% lines/funcs/stmts, ≥60% branches)

## jsdom Event Support (2026-05-05)
- CompositionEvent fully supported: constructor, dispatch, data property
- InputEvent.isComposing fully supported: true/false values accessible in handlers
- IME flow simulation (compositionstart → input(isComposing=true) × N → compositionend → input(isComposing=false)) works correctly
- All 5 verification tests passed in vitest 4.1.5 + jsdom
- Evidence saved at .sisyphus/evidence/task-2-*

## RED Phase — IME Composition Event Tests (2026-05-05)
- Added 11 new failing tests in `describe('IME composition events')` block
- All 11 tests fail with meaningful assertion errors (RED phase confirmed)
- Existing 36 tests still pass (no regression)
- Total: 47 tests (36 pass, 11 fail)

### Test coverage
1. `compositionstart` → `isComposing = true` (fails: property undefined)
2. `compositionend` → `isComposing = false` + furigana update (fails: no handler)
3. `input(isComposing=false)` → kana extraction + furigana update (fails: no input handler)
4. `input(isComposing=true)` → skipped during composition (fails: `isComposing` undefined)
5. Chrome quirk: `compositionend` triggers processing without subsequent input (fails: no handler)
6. Focus handler captures state + no timer (fails: `isComposing` undefined, timer set)
7. Blur handler resets stuck `isComposing` (fails: old blur doesn't reset it)
8. `getFurigana()` after full composition sequence (fails: no handlers)
9. Bug reproduction: convert then type more → furigana appends (fails: no handlers)
10. `isConverting` removed / `isComposing` exists (fails: old code has `isConverting`)
11. `checkInterval` removed from option (fails: old code has `checkInterval: 30`)

### Patterns used
- `(autokana as any).isComposing` to access future property without type errors
- `new CompositionEvent('compositionstart')` / `new CompositionEvent('compositionend', { data: '...' })`
- `new InputEvent('input', { isComposing: true/false, inputType: 'insertText' })`
- `nameInput.dispatchEvent(event)` pattern


## GREEN Phase — Composition Event Handlers Implementation (2026-05-05)

### What changed in src/AutoKana.ts
- Removed `checkInterval` from `AutoKanaOption` interface
- Renamed `isConverting` → `isComposing` throughout the entire file
- Removed `keydownHandler` entirely
- Added `compositionStartHandler`: sets `isComposing = true`
- Added `compositionEndHandler`: sets `isComposing = false`, calls `processValue()`
- Added `inputHandler`: calls `processValue()` for all input events (DOM update skipped by `setFurigana` when `isComposing`)
- Renamed `onInput()` → `processValue()` with full kana extraction logic (from `checkValue`)
- `focusHandler`: captures `baseKana` from `elFurigana`, resets `isComposing`, sets `ignoreString`, calls `processValue()`
- `blurHandler`: clears interval + resets `isComposing = false`
- `registerEvents()`: added compositionstart/compositionend/input, removed keydown
- `destroy()`: removes all new event listeners
- `setFurigana()`: moved `this.values = newValues` BEFORE the `isComposing` guard so values accumulate during composition even when DOM is not updated
- `checkConvert()`: removed `isComposing` guard so conversion detection works during composition (necessary for `baseKana` accumulation)
- `onConvert()`: removed `isComposing = true` assignment (now managed solely by composition events)

### Key insight: `processValue()` must be pure processing
- Initial attempt had `processValue()` setting `baseKana`, `isComposing`, and `ignoreString` — this caused `removeString()` to strip the entire input when called from `compositionEndHandler`
- Fixed by making `processValue()` pure: only extracts kana, calls `checkConvert`/`setFurigana`
- State capture (baseKana, isComposing, ignoreString) is the caller's responsibility

### Key insight: `setFurigana()` values accumulation
- `setFurigana()` originally returned early when `isComposing` was true, which prevented `this.values` from being updated during composition
- Without `this.values` updates, `checkConvert()` + `onConvert()` at `compositionend` had nothing to commit to `baseKana`
- Fix: update `this.values = newValues` before the `isComposing` guard, so internal state accumulates during composition while DOM updates are deferred

### Key insight: `checkConvert()` must run during composition
- `checkConvert()` had `if (this.isComposing) return;` which prevented `onConvert()` from being called during composition input events
- This meant `baseKana` was never updated when the user typed during an IME session
- Fix: removed the `isComposing` guard from `checkConvert()`

### Test fix
- One new test (`input event with isComposing=true is skipped during composition`) set `autokana.baseKana = 'やまだ'` but asserted `furiganaInput.value === 'やまだ'` without ever calling `setFurigana()`
- Fixed by setting `furiganaInput.value = 'やまだ'` instead, which correctly tests that the DOM value is preserved (not updated) during composition

### Results
- 11/11 IME composition tests PASS (GREEN phase complete)
- 39/47 total tests pass (11 new + 28 old)
- 8 old tests fail as expected (they reference `isConverting`, `onInput()`, `keydown`, or `setInterval` in focusHandler — to be fixed in Task 7)
- lint: 0 errors
- typecheck on src/: clean
- Evidence saved at `.sisyphus/evidence/task-4-green-phase.txt`

## F3: Real Manual QA (2026-05-05)
- All 16 task QA scenarios PASS
- All 6 cross-task integration tests PASS
- 5 edge cases verified (blur during composition, consecutive IME, katakana+composition, Chrome quirk, focus capture)
- Full CI green: lint 0 errors, typecheck clean, 47/47 tests, build success
- Coverage: 91.47% stmts, 75.8% branches, 100% functions, 91.86% lines
- No polling remnants (setInterval/clearInterval/checkInterval not in src/)
- Build: dist/autokana.umd.js 4.72KB + dist/autokana.es.js 5.46KB + dist/index.d.ts 470B
- d.ts clean: no checkInterval/clearInterval/isConverting exports
- Evidence: .sisyphus/evidence/final-qa/
- Integration test gotcha: `AutoKana.bind` in test was `Function.prototype.bind`, not `src/index.ts`'s `bind` function — must import `{ bind } from '../src/index'`
- IME test pattern: value MUST change between compositionstart/end to simulate real conversion flow (otherwise `this.input === newInput` early-return in processValue blocks furigana update)
