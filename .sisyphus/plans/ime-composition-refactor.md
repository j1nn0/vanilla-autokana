# IME Composition Event Refactoring

## TL;DR

> **Quick Summary**: Linux ChromeでIME変換後の追加入力がふりがなに反映されないバグを修正。根本原因はpolling+keydown方式がLinux Chromeのibus/fcitx IME環境（composition中にinput.valueが更新されない）と相性不良なため。polling+keydownをcomposition events+input eventsに完全に置き換えるリファクタリングを実施。
> 
> **Deliverables**:
> - `src/AutoKana.ts` のイベント処理を composition events + input events に移行
> - `isConverting` を `isComposing` にリネーム
> - polling機構（setInterval/clearInterval/timer）を完全削除
> - `AutoKanaOption` から `checkInterval` を削除（breaking change）
> - composition events のテストスイート追加（TDD）
> - Chromeの `isComposing` クセ対応
> - blur中のIME入力フォールバック実装
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves with parallel tasks
> **Critical Path**: Task 1 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8 → F1-F4

---

## Context

### Original Request
「やまだ」と入力してからスペースキーを押して「山田」という漢字に変換した後、「たろう」を入力してもふりがなに反映されない。Linux Chromeで再現、FirefoxやWindows Chromeでは再現しない。環境依存の可能性あり。リファクタリングを含む範囲で修正したい。

### Interview Summary
**Key Discussions**:
- 修正範囲: リファクタリング含む（最小修正ではなく、IME入力全体のイベント処理を見直す）
- デバッグ確認: 不可（Linux Chrome環境でのdebug:trueログ取得が難しい）
- クロスブラウザQA: 不要（Linux Chrome修正に集中、他ブラウザは既存動作を壊さないことのみ確認）
- テスト戦略: TDD（実装前にテストを書く）

**Research Findings**:
- **根本原因**: Linux Chrome + ibus/fcitx では、IME編集中に `input.value` が更新されない。`compositionend` 後に一括更新されるため、`checkConvert()` が過剰反応して `onConvert()` → `isConverting=true` を設定し、`setFurigana()` がブロックされる
- **React/Firefox/Windows Chrome**: IME編集中に `value` が更新されるため、pollingが中間値を拾えて問題が発生しない
- **WanaKana**: production-grade の日本語入力ライブラリ。`input` + `compositionstart/compositionend` を使用。polling不使用
- **Chrome quirk**: `compositionend` の前の最終 `input` イベントでも `isComposing=true`（W3C issue #394）

### Metis Review
**Identified Gaps** (addressed):
- `checkInterval` オプションの取り扱い → 削除（breaking changeとして文書化）
- `isConverting` と `isComposing` の佗存リスク → 一貫して `isComposing` のみ使用
- blur中のIME入力フォールバック → `compositionend` が発火しない場合に `isComposing` をリセット
- テスト実行可能性 → jsdomのCompositionEvent/InputEvent対応確認が必要
- paste イベント → `input(isComposing=false)` で処理されるため特別な対応不要

---

## Work Objectives

### Core Objective
Linux ChromeでIME変換後の追加入力がふりがなに反映されないバグを修正し、イベント処理をpolling+keydownからcomposition events+input eventsに完全に移行する。

### Concrete Deliverables
- `src/AutoKana.ts`: イベント処理の完全リファクタリング
- `__tests__/AutoKana.test.ts`: composition events のテストスイート追加
- `pnpm run ci` が全て通ること

### Definition of Done
- [ ] `pnpm exec vitest run __tests__/AutoKana.test.ts` → 全テストPASS（exit code 0）
- [ ] `pnpm run typecheck` → エラーなし
- [ ] `pnpm run lint` → エラーなし
- [ ] `pnpm run build` → dist/autokana.umd.js, dist/autokana.es.js, dist/index.d.ts が生成される
- [ ] `pnpm run ci` → 全ステージPASS

### Must Have
- compositionstart/compositionend/input イベントリスナーの追加
- isConverting → isComposing リネーム（一貫性）
- polling機構（setInterval/clearInterval/timer）の完全削除
- checkInterval オプションの削除（breaking change）
- keydownベースのIME検知ロジックの削除
- Chrome quirk対応（compositionend後のisComposing=true inputイベント処理）
- blur中の composition フォールバック
- TDD: 新しい振る舞いのテストを先に書き、実装でPASSさせる

### Must NOT Have (Guardrails)
- polling + composition events のハイブリッド実装（デグレの温床）
- isConverting と isComposing の併存（リネームは一貫して実施）
- public API シグネチャの変更（bind(), AutoKana, AutoKanaOption の型は互換性を維持、checkInterval削除を除く）
- dist/ の手動編集（build時に自動生成）
- setTimeout/setInterval に依存するflakyテスト（composition eventsは同期的にテスト可能）
- 手動ブラウザテストを受け入れ基準に含める（jsdomでイベント順序を再現）
- AIスロップ: 過剰なコメント、不要な抽象化、汎用的すぎる変数名

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (vitest + jsdom)
- **Automated tests**: YES (TDD)
- **Framework**: vitest (jsdom environment)
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Unit Tests**: `pnpm exec vitest run __tests__/AutoKana.test.ts` — composition event simulation
- **Typecheck**: `pnpm run typecheck` — type safety verification
- **Lint**: `pnpm run lint` — code quality
- **Build**: `pnpm run build` — production build verification
- **Full CI**: `pnpm run ci` — combined verification

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — baseline verification):
├── Task 1: Verify existing test baseline [quick]
└── Task 2: Verify jsdom CompositionEvent support [quick]

Wave 2 (After Wave 1 — RED phase, write failing tests):
└── Task 3: Write composition event test suite (RED) [deep]

Wave 3 (After Wave 2 — GREEN phase, implementation):
├── Task 4: Implement composition event handlers + rename state [deep]
└── Task 5: Remove polling mechanism + update AutoKanaOption [unspecified-high] (depends: 4)

Wave 4 (After Wave 3 — edge cases + test updates):
├── Task 6: Handle edge cases (blur/paste/continuous conversion) [deep]
└── Task 7: Update existing tests for new event model [unspecified-high]

Wave 5 (After Wave 4 — final verification):
└── Task 8: Full CI verification + build check [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high)
└── F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8 → F1-F4 → user okay
Parallel Speedup: ~20% (most tasks are sequential due to file dependencies)
Max Concurrent: 2 (Waves 1 & 3)
```

### Dependency Matrix

| Task | Depends On | Blocks | Parallel With |
|------|-----------|--------|---------------|
| 1 | - | 3 | 2 |
| 2 | - | 3 | 1 |
| 3 | 1, 2 | 4 | - |
| 4 | 3 | 5, 6 | - |
| 5 | 4 | 6 | - |
| 6 | 5 | 7 | - |
| 7 | 6 | 8 | - |
| 8 | 7 | F1-F4 | - |

### Agent Dispatch Summary

- **Wave 1**: **2** — T1 → `quick`, T2 → `quick`
- **Wave 2**: **1** — T3 → `deep`
- **Wave 3**: **2** — T4 → `deep`, T5 → `unspecified-high`
- **Wave 4**: **2** — T6 → `deep`, T7 → `unspecified-high`
- **Wave 5**: **1** — T8 → `quick`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Verify existing test baseline

  **What to do**:
  - Run `pnpm run ci` to verify all existing tests pass, typecheck passes, lint passes, and build succeeds
  - Record baseline test count and coverage thresholds
  - This establishes a known-good starting point before any changes

  **Must NOT do**:
  - Modify any source or test files
  - Skip failing tests with `.skip()` or `.todo()`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Simple verification command, no complex logic

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `package.json` — scripts section for available commands
  - `__tests__/AutoKana.test.ts` — existing test structure

  **WHY Each Reference Matters**:
  - `package.json`: Understand available npm scripts and their definitions
  - `__tests__/AutoKana.test.ts`: Baseline test patterns and count

  **Acceptance Criteria**:

  **If TDD (tests enabled):**
  - [ ] `pnpm run ci` exits with code 0

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Baseline CI passes
    Tool: Bash
    Preconditions: Clean working directory, dependencies installed
    Steps:
      1. Run `pnpm run ci`
      2. Verify exit code is 0
      3. Verify test count matches expected range (current: ~25 tests)
    Expected Result: Exit code 0, all stages pass (lint, typecheck, test, build)
    Failure Indicators: Exit code non-zero, any stage fails
    Evidence: .sisyphus/evidence/task-1-baseline-ci.txt

  Scenario: Test count baseline
    Tool: Bash
    Preconditions: pnpm install completed
    Steps:
      1. Run `pnpm exec vitest run __tests__/AutoKana.test.ts`
      2. Count test cases in output
      3. Verify all tests pass
    Expected Result: All existing tests pass, test count is recorded
    Failure Indicators: Any test fails, unexpected test count
    Evidence: .sisyphus/evidence/task-1-test-count.txt
  ```

  **Commit**: NO (verification only)

- [x] 2. Verify jsdom CompositionEvent and InputEvent support

  **What to do**:
  - Create a small test file to verify that jsdom supports `CompositionEvent`, `InputEvent` with `isComposing` property, and `new Event('focus')`/`new Event('blur')` patterns
  - Verify that `new CompositionEvent('compositionstart')`, `new CompositionEvent('compositionend', { data: 'やまだ' })`, and `new InputEvent('input', { isComposing: true/false })` work correctly in the jsdom test environment
  - Document any jsdom limitations that need workarounds
  - Delete the temporary test file after verification

  **Must NOT do**:
  - Modify `src/AutoKana.ts` or `__tests__/AutoKana.test.ts`
  - Add temporary test cases to the existing test file

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Quick verification with a temporary test file, no complex implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `__tests__/AutoKana.test.ts:1-10` — test setup pattern (setup function, imports)
  - `__tests__/AutoKana.test.ts:159-170` — focus/blur event dispatch pattern (`new Event('focus')`)
  - `__tests__/AutoKana.test.ts:172-185` — keydown event dispatch pattern

  **API/Type References**:
  - MDN CompositionEvent: https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent
  - MDN InputEvent: https://developer.mozilla.org/en-US/docs/Web/API/InputEvent

  **WHY Each Reference Matters**:
  - Existing test patterns show how events are dispatched in jsdom — need to verify CompositionEvent/InputEvent follow the same pattern
  - MDN docs clarify constructor parameters and property names needed for test simulation

  **Acceptance Criteria**:

  **If TDD (tests enabled):**
  - [ ] Temporary test file created and run successfully
  - [ ] CompositionEvent constructor works in jsdom
  - [ ] InputEvent with `isComposing` property works in jsdom
  - [ ] Documented any jsdom limitations
  - [ ] Temporary test file deleted after verification

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: CompositionEvent support verification
    Tool: Bash
    Preconditions: pnpm install completed
    Steps:
      1. Create a temporary test file testing CompositionEvent dispatch
      2. Run `pnpm exec vitest run <temp-file>`
      3. Verify compositionstart/compositionend events can be dispatched and received
      4. Verify event.data property is accessible
      5. Delete temporary test file
    Expected Result: CompositionEvent works in jsdom, events fire correctly
    Failure Indicators: CompositionEvent constructor not available, event.data not accessible
    Evidence: .sisyphus/evidence/task-2-composition-event-support.txt

  Scenario: InputEvent isComposing support verification
    Tool: Bash
    Preconditions: pnpm install completed
    Steps:
      1. Create a temporary test file testing InputEvent with isComposing
      2. Run `pnpm exec vitest run <temp-file>`
      3. Verify `new InputEvent('input', { isComposing: true })` creates event with isComposing=true
      4. Verify `new InputEvent('input', { isComposing: false })` creates event with isComposing=false
      5. Delete temporary test file
    Expected Result: InputEvent.isComposing property works in jsdom
    Failure Indicators: isComposing property not available, InputEvent constructor fails
    Evidence: .sisyphus/evidence/task-2-input-event-support.txt
  ```

  **Commit**: NO (verification only, temp file deleted)

- [x] 3. Write composition event test suite (RED phase)

  **What to do**:
  - Add a new `describe('IME composition events')` block to `__tests__/AutoKana.test.ts`
  - Write failing tests for ALL new behaviors that composition event handling should support:
    1. `compositionstart` sets `isComposing = true` and prevents furigana updates during composition
    2. `compositionend` sets `isComposing = false` and processes the final value (updates furigana)
    3. Normal `input` event with `isComposing = false` processes the value (extracts kana, updates furigana)
    4. `input` event with `isComposing = true` is ignored (no furigana update)
    5. Chrome quirk: after `compositionend`, the next `input` event may have `isComposing = true` — furigana should still update correctly
    6. Focus/blur: `isComposing` is reset on blur; focus re-captures current state
    7. `getFurigana()` returns correct value after composition sequence (type → convert → confirm → type more)
    8. Combined scenario: "やまだ" → convert to "山田" → continue typing "たろう" → furigana should be "やまだたろう"
    9. `isConverting` property no longer exists (verifies rename to `isComposing`)
    10. `checkInterval` option no longer exists (verifies removal)
  - Run tests to verify they FAIL (RED phase)
  - Do NOT implement any production code yet

  **Must NOT do**:
  - Implement production code in `src/AutoKana.ts`
  - Modify existing test cases (they should still pass)
  - Use `.skip()` or `.todo()` to bypass failing tests

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`test-driven-development`]
    - `test-driven-development`: This IS the RED phase of TDD — skill provides TDD workflow guidance
  - **Skills Evaluated but Omitted**:
    - `typescript-advanced-types`: No complex type manipulation needed for test writing

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1, Task 2

  **References**:

  **Pattern References**:
  - `__tests__/AutoKana.test.ts:1-10` — test imports and setup function pattern
  - `__tests__/AutoKana.test.ts:6-8` — `setup()` function that creates DOM elements
  - `__tests__/AutoKana.test.ts:159-170` — focus/blur event dispatch pattern
  - `__tests__/AutoKana.test.ts:172-185` — keydown event dispatch pattern (will be replaced)
  - `__tests__/AutoKana.test.ts:250-262` — `onInput()` test (behavior to replicate with composition events)

  **API/Type References**:
  - `src/AutoKana.ts:140-151` — AutoKana class properties (isConverting will become isComposing)
  - `src/AutoKana.ts:231-235` — `registerEvents()` method (events to be replaced)

  **External References**:
  - MDN CompositionEvent: https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent
  - MDN InputEvent.isComposing: https://developer.mozilla.org/en-US/docs/Web/API/InputEvent/isComposing

  **WHY Each Reference Matters**:
  - Setup function pattern: must follow existing test structure for consistency
  - Event dispatch patterns: shows how to simulate events in jsdom (extend for CompositionEvent/InputEvent)
  - AutoKana properties: understanding current state management (isConverting, values, baseKana) is essential for writing meaningful assertions
  - registerEvents: knowing which events are currently registered helps understand what needs to change

  **Acceptance Criteria**:

  **If TDD (tests enabled):**
  - [ ] New `describe('IME composition events')` block exists in `__tests__/AutoKana.test.ts`
  - [ ] At least 8 test cases covering compositionstart, compositionend, input isComposing, Chrome quirk, focus/blur, getFurigana
  - [ ] All new tests FAIL (RED phase confirmed)
  - [ ] Existing tests still PASS (no regression in setup)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: New tests are written and fail (RED)
    Tool: Bash
    Preconditions: Task 1 baseline confirmed passing
    Steps:
      1. Run `pnpm exec vitest run __tests__/AutoKana.test.ts`
      2. Verify new test cases exist in "IME composition events" describe block
      3. Verify new tests FAIL (expected for RED phase)
      4. Verify existing tests still PASS
    Expected Result: New tests fail, existing tests pass. Total test count increased by 8+.
    Failure Indicators: New tests pass (should fail in RED phase), existing tests fail (regression)
    Evidence: .sisyphus/evidence/task-3-red-phase.txt

  Scenario: Bug reproduction test captures the exact issue
    Tool: Bash
    Preconditions: Task 1 baseline confirmed
    Steps:
      1. Run `pnpm exec vitest run __tests__/AutoKana.test.ts -t "continues typing after conversion"`
      2. Verify the test fails with the expected behavior (furigana should contain "たろう" but doesn't)
    Expected Result: Test fails, demonstrating the bug
    Failure Indicators: Test passes (bug already fixed, or test doesn't actually test the scenario)
    Evidence: .sisyphus/evidence/task-3-bug-reproduction.txt
  ```

  **Commit**: YES
  - Message: `test(autokana): add composition event test suite (RED)`
  - Files: `__tests__/AutoKana.test.ts`
  - Pre-commit: `pnpm exec vitest run __tests__/AutoKana.test.ts`

- [x] 4. Implement composition event handlers + rename state

  **What to do**:
  - Replace `keydown` handler with `input` + `compositionstart` + `compositionend` handlers in `registerEvents()`
  - Add new private handlers: `compositionStartHandler`, `compositionEndHandler`, `inputHandler`
  - Rename `isConverting` → `isComposing` throughout the entire file (no coexistence)
  - Rename `onInput()` → `processValue()` (or similar) since this method's semantics change
  - Implement `compositionstart` handler: set `isComposing = true`, skip furigana updates during composition
  - Implement `compositionend` handler: set `isComposing = false`, capture current furigana value, record ignore string, then process the committed value
  - Implement `input` handler: check `event.isComposing` — if false (after compositionend), process normally; if true, skip
  - Handle Chrome quirk: in `compositionend` handler, explicitly call processValue() because Chrome may not fire a subsequent `input(isComposing=false)` event
  - Update `focusHandler` and `blurHandler`: keep focus for state capture, remove polling start/stop
  - Update `destroy()`: remove all new event listeners
  - Make Task 3 tests PASS (GREEN phase)

  **Must NOT do**:
  - Keep `keydown` handler alongside composition events (hybrid forbidden)
  - Keep `isConverting` alongside `isComposing` (rename completely)
  - Modify existing test cases (they will be updated in Task 7)
  - Add `setTimeout`/`setInterval`-based workarounds

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`test-driven-development`]
    - `test-driven-development`: This is the GREEN phase of TDD — implement minimum to make tests pass
  - **Skills Evaluated but Omitted**:
    - `typescript-advanced-types`: No advanced type manipulation needed for this task

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential, before Task 5)
  - **Blocks**: Task 5
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `src/AutoKana.ts:153-169` — current event handlers (keydownHandler, focusHandler, blurHandler) — to be replaced with compositionstart/compositionend/input handlers
  - `src/AutoKana.ts:231-235` — `registerEvents()` method — add new event listeners, remove keydown
  - `src/AutoKana.ts:343-350` — `onInput()` method — rename to `processValue()` and refactor semantics
  - `src/AutoKana.ts:352-357` — `onConvert()` method — adapt for composition-based detection

  **API/Type References**:
  - `src/AutoKana.ts:140-151` — class properties, `isConverting` to be renamed `isComposing`
  - `src/AutoKana.ts:6-10` — `AutoKanaOption` interface — `checkInterval` to be removed in Task 5

  **Test References**:
  - `__tests__/AutoKana.test.ts` — Task 3's RED tests must now PASS

  **External References**:
  - MDN CompositionEvent: https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent
  - WanaKana source (composition handling pattern): https://github.com/WaniKani/WanaKana/blob/master/src/dom/keyboardHandler.js

  **WHY Each Reference Matters**:
  - Current event handlers: the exact code to be replaced, understanding the current flow is critical
  - AutoKana properties: `isConverting` → `isComposing` rename must be complete and consistent
  - onInput/onConvert: core logic that needs refactoring for composition events
  - WanaKana: production-proven composition event pattern for Japanese input

  **Acceptance Criteria**:

  **If TDD (tests enabled):**
  - [ ] Task 3's composition event tests now PASS (GREEN)
  - [ ] `compositionstart` handler sets `isComposing = true`
  - [ ] `compositionend` handler clears `isComposing` and processes final value
  - [ ] `input` handler with `isComposing = false` processes normally
  - [ ] `input` handler with `isComposing = true` is skipped
  - [ ] Chrome quirk handled in `compositionend`
  - [ ] `isConverting` fully renamed to `isComposing` (no remnants)
  - [ ] `onInput()` renamed to `processValue()` (or similar)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Composition event tests pass (GREEN)
    Tool: Bash
    Preconditions: Task 3 RED tests exist
    Steps:
      1. Run `pnpm exec vitest run __tests__/AutoKana.test.ts`
      2. Verify "IME composition events" describe block tests now PASS
      3. Verify test output shows GREEN for all composition event tests
    Expected Result: All composition event tests pass, implementation correctly handles composition events
    Failure Indicators: Any composition event test fails, isConverting still exists
    Evidence: .sisyphus/evidence/task-4-green-phase.txt

  Scenario: Key bug fix - convert then continue
    Tool: Bash
    Preconditions: Composition events implemented
    Steps:
      1. Run `pnpm exec vitest run __tests__/AutoKana.test.ts -t "continues typing after conversion"`
      2. Verify the test passes: furigana contains "たろう" after conversion
    Expected Result: Bug is fixed — furigana updates correctly after IME conversion
    Failure Indicators: Test still fails (bug not fixed)
    Evidence: .sisyphus/evidence/task-4-bug-fix.txt
  ```

  **Commit**: YES (groups with Task 5)
  - Message: `refactor(autokana): replace polling+keydown with composition events`
  - Files: `src/AutoKana.ts`, `src/index.ts` (if exports change)
  - Pre-commit: `pnpm exec vitest run __tests__/AutoKana.test.ts`

- [x] 5. Remove polling mechanism + update AutoKanaOption

  **What to do**:
  - Remove `setInterval()` method — no longer needed (event-driven instead)
  - Remove `clearInterval()` method — no longer needed
  - Remove `timer` property from the class
  - Remove `checkInterval` from `AutoKanaOption` interface — this is a breaking change (the option no longer does anything)
  - Remove `checkInterval` default value from constructor
  - Remove `checkValue()` method — polling-specific logic, replaced by `inputHandler`
  - Remove `setInterval()` call from `focusHandler` — focus no longer starts polling
  - Remove `clearInterval()` call from `blurHandler` — blur no longer stops polling
  - Update `focusHandler`: keep `processValue()` call for state capture (was `onInput()`)
  - Update `blurHandler`: keep `isComposing` reset for safety, remove polling cleanup
  - Remove `checkConvert()` method — was called from `checkValue()`, now replaced by composition event detection
  - Remove `removeString()` method — only used by `checkValue()`, no longer needed
  - Remove `input` property from the class — was tracking input for polling comparison, no longer needed
  - Remove `ignoreString` property — was used by `removeString()`, no longer needed
  - Simplify `processValue()` (was `checkValue`/`onInput`): extract kana from value, update furigana directly
  - Run all tests to verify nothing is broken

  **Must NOT do**:
  - Keep polling mechanism as a fallback — MUST be fully removed
  - Keep `checkInterval` as a deprecated option — remove it completely
  - Introduce `setTimeout` as a replacement for `setInterval`
  - Modify existing test assertions (they will be updated in Task 7)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: Significant code removal and simplification, but no complex new logic

  **Parallelization**:
  - **Can Run In Parallel**: NO (must be sequential after Task 4)
  - **Parallel Group**: Wave 3 (after Task 4)
  - **Blocks**: Task 6
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `src/AutoKana.ts:335-341` — `setInterval()` method — to be deleted
  - `src/AutoKana.ts:237-242` — `clearInterval()` method — to be deleted
  - `src/AutoKana.ts:312-332` — `checkValue()` method — to be deleted
  - `src/AutoKana.ts:297-309` — `checkConvert()` method — to be deleted
  - `src/AutoKana.ts:283-295` — `removeString()` method — to be deleted
  - `src/AutoKana.ts:6-10` — `AutoKanaOption` interface — `checkInterval` to be removed
  - `src/AutoKana.ts:148-150` — `ignoreString`, `input` properties — to be removed

  **WHY Each Reference Matters**:
  - Each method/property to be deleted must be verified for no remaining references
  - AutoKanaOption interface change is a breaking change — must be documented in commit message
  - Understanding which methods depend on polling ensures clean removal without broken references

  **Acceptance Criteria**:

  - [ ] `setInterval`, `clearInterval`, `timer` property removed
  - [ ] `checkInterval` removed from `AutoKanaOption` interface
  - [ ] `checkValue()`, `checkConvert()`, `removeString()`, `input`, `ignoreString` removed
  - [ ] `focusHandler` no longer calls `setInterval()`
  - [ ] `blurHandler` no longer calls `clearInterval()`
  - [ ] No references to removed methods/properties exist in `src/AutoKana.ts`
  - [ ] TypeScript compiles without errors (`pnpm run typecheck`)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: No polling remnants in codebase
    Tool: Bash
    Preconditions: Task 4 implementation complete
    Steps:
      1. Run `grep -n 'setInterval\|clearInterval\|checkInterval\|checkValue\|checkConvert\|removeString\|ignoreString' src/AutoKana.ts`
      2. Verify no matches found (all removed)
      3. Run `pnpm run typecheck` to verify no type errors
    Expected Result: No matches found, typecheck passes
    Failure Indicators: Any remnant found, type errors
    Evidence: .sisyphus/evidence/task-5-no-polling-remnants.txt

  Scenario: Composition event tests still pass
    Tool: Bash
    Preconditions: Polling mechanism removed
    Steps:
      1. Run `pnpm exec vitest run __tests__/AutoKana.test.ts`
      2. Verify composition event tests still pass
    Expected Result: All composition event tests pass
    Failure Indicators: Any test regression
    Evidence: .sisyphus/evidence/task-5-tests-still-pass.txt
  ```

  **Commit**: YES (groups with Task 4)
  - Message: `refactor(autokana): replace polling+keydown with composition events`
  - Files: `src/AutoKana.ts`
  - Pre-commit: `pnpm exec vitest run __tests__/AutoKana.test.ts && pnpm run typecheck`

- [x] 6. Handle edge cases (blur during composition, paste, continuous conversion)

  **What to do**:
  - **Blur during composition**: When the name field loses focus while `isComposing = true`, `compositionend` may not fire. Reset `isComposing = false` and process the final value in the `blurHandler`.
  - **Paste input**: Verify that paste events are handled correctly — `input` events from pasting should have `isComposing = false` and be processed normally (kana extraction from pasted text).
  - **Continuous conversion**: "やまだ" → "山田" → immediately type "たなか" → "田中" — verify `isComposing` state transitions correctly across consecutive IME conversions.
  - **Empty input reset**: When all text is deleted during or after composition, `initializeValues()` should still work correctly.
  - **compositionstart without subsequent compositionend**: Guard against stale `isComposing` state by resetting on focus.
  - Write tests for all edge cases in the existing `describe('IME composition events')` block

  **Must NOT do**:
  - Add `setTimeout`-based fallbacks for edge cases
  - Over-engineer the edge case handling — keep it simple and robust
  - Add excessive edge case tests that test browser-specific behavior (only test logical behavior)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`test-driven-development`]
    - `test-driven-development`: Write edge case tests first (RED), then implement (GREEN)
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI work needed, just event handling logic

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential)
  - **Blocks**: Task 7
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `src/AutoKana.ts` — the `blurHandler`, `focusHandler`, and new `compositionEndHandler` — these are where edge cases need to be handled
  - `__tests__/AutoKana.test.ts` — existing edge case tests (e.g., lines 285-295 for empty input reset, lines 81-89 for toggle) as patterns for new edge case tests
  - `__tests__/AutoKana.test.ts:197-211` — `removeString()` tests — these will be removed but show edge case testing patterns

  **WHY Each Reference Matters**:
  - blurHandler/focusHandler: where isComposing reset must occur
  - Existing edge case tests: patterns for testing state machine behavior
  - removeString tests: understanding current edge case patterns for kana extraction

  **Acceptance Criteria**:

  - [ ] Blur during composition: `isComposing` reset and furigana updated
  - [ ] Paste input with kana content: furigana extracted correctly
  - [ ] Consecutive IME conversions: state transitions correctly
  - [ ] Empty input after composition: `initializeValues()` works
  - [ ] compositionstart without compositionend: focus handler resets stale state

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Blur during composition resets state
    Tool: Bash
    Preconditions: Composition event implementation complete
    Steps:
      1. Run specific test: `pnpm exec vitest run __tests__/AutoKana.test.ts -t "blur during composition"`
      2. Verify isComposing is reset and furigana is captured
    Expected Result: Test passes, isComposing=false after blur, furigana preserved
    Failure Indicators: isComposing stuck at true, furigana not updated
    Evidence: .sisyphus/evidence/task-6-blur-during-composition.txt

  Scenario: Consecutive IME conversions work
    Tool: Bash
    Preconditions: Composition event implementation complete
    Steps:
      1. Run specific test: `pnpm exec vitest run __tests__/AutoKana.test.ts -t "consecutive"`
      2. Verify furigana accumulates correctly across multiple conversions
    Expected Result: "やまだ" → convert → "たなか" → convert → furigana = "やまたなか"
    Failure Indicators: Furigana stuck, duplicated, or missing
    Evidence: .sisyphus/evidence/task-6-consecutive-conversions.txt
  ```

  **Commit**: YES
  - Message: `fix(autokana): handle blur-during-composition and edge cases`
  - Files: `src/AutoKana.ts`, `__tests__/AutoKana.test.ts`
  - Pre-commit: `pnpm exec vitest run __tests__/AutoKana.test.ts`

- [x] 7. Update existing tests for new event model

  **What to do**:
  - Update existing test cases that test removed/polling-specific behavior:
    - Tests referencing `isConverting` → update to `isComposing`
    - Tests referencing `checkInterval` → remove (option no longer exists)
    - Tests referencing `setInterval`/`clearInterval` → remove (methods no longer exist)
    - Tests referencing `keydown` event dispatch → update to composition events
    - Tests referencing `onInput()` method → update to `processValue()` (or new name)
    - Tests referencing `checkValue()` → remove (method no longer exists)
    - Tests referencing `removeString()` → remove (method no longer exists)
    - Tests referencing `ignoreString`, `input`, `timer` properties → remove (no longer exist)
  - Ensure all existing tests for preserved functionality still pass:
    - `init`, `init with pass elements`, toggle, destroy
    - `getFurigana()`, `start()`, `stop()` behavior
    - Focus/blur event behavior (updated for event-driven model)
    - `toKatakana()` conversion tests
    - `bind()` with various selector types
  - Remove `checkInterval`-related tests if any
  - Ensure no `.skip()` or `.todo()` remains in the test file

  **Must NOT do**:
  - Remove tests for functionality that should still work (like toKatakana, getFurigana, bind, etc.)
  - Add new test cases for new features (that was Task 3)
  - Use `.skip()` to bypass failing tests instead of fixing them

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: Primarily test file updates with mechanical changes, no complex new logic

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (after Task 6)
  - **Blocks**: Task 8
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `__tests__/AutoKana.test.ts:126-136` — `clearInterval()` tests — to be removed
  - `__tests__/AutoKana.test.ts:138-148` — `setInterval()` tests — to be removed
  - `__tests__/AutoKana.test.ts:150-157` — `destroy()` clears timer — to be updated (no timer)
  - `__tests__/AutoKana.test.ts:159-170` — focus/blur interval tests — to be updated
  - `__tests__/AutoKana.test.ts:172-185` — keydown while converting — to be updated for composition events
  - `__tests__/AutoKana.test.ts:187-195` — `checkConvert()` tests — to be removed (method gone)
  - `__tests__/AutoKana.test.ts:197-211` — `removeString()` tests — to be removed (method gone)
  - `__tests__/AutoKana.test.ts:250-262` — `onInput()` tests — to be updated for new method name
  - `__tests__/AutoKana.test.ts:274-283` — `onConvert()` tests — to be updated for composition events
  - `__tests__/AutoKana.test.ts:285-295` — `checkValue()` tests — to be removed (method gone)
  - `__tests__/AutoKana.test.ts:297-310` — `checkValue()` skip tests — to be removed
  - `__tests__/AutoKana.test.ts:324-332` — `destroy()` removes event listeners — to be updated

  **WHY Each Reference Matters**:
  - Each referenced test needs specific migration: some are removed entirely (polled methods gone), some need updates (event model changed), some are preserved unchanged (toKatakana, getFurigana, etc.)

  **Acceptance Criteria**:

  - [ ] All tests referencing removed methods/properties are removed or updated
  - [ ] All tests referencing removed events (keydown) are updated for composition events
  - [ ] `isConverting` references in tests are updated to `isComposing`
  - [ ] All preserved functionality tests still pass
  - [ ] No `.skip()` or `.todo()` in the test file
  - [ ] `pnpm exec vitest run __tests__/AutoKana.test.ts` — all tests PASS

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All tests pass after migration
    Tool: Bash
    Preconditions: Task 6 edge cases implemented
    Steps:
      1. Run `pnpm exec vitest run __tests__/AutoKana.test.ts`
      2. Verify ALL tests pass (both new composition tests and updated existing tests)
      3. Verify no `.skip()` or `.todo()` in test file
    Expected Result: All tests pass, zero skipped/TODO tests
    Failure Indicators: Any test fails, skipped tests exist
    Evidence: .sisyphus/evidence/task-7-all-tests-pass.txt

  Scenario: No references to removed methods
    Tool: Bash
    Preconditions: Tests updated
    Steps:
      1. Run `grep -n 'checkValue\|checkConvert\|removeString\|setInterval\|clearInterval\|checkInterval\|isConverting\|ignoreString' __tests__/AutoKana.test.ts`
      2. Verify no matches found (all removed/updated)
    Expected Result: No matches found
    Failure Indicators: References to removed methods still exist
    Evidence: .sisyphus/evidence/task-7-no-removed-refs.txt
  ```

  **Commit**: YES
  - Message: `test(autokana): update existing tests for composition event model`
  - Files: `__tests__/AutoKana.test.ts`
  - Pre-commit: `pnpm exec vitest run __tests__/AutoKana.test.ts`

- [x] 8. Full CI verification + build check

  **What to do**:
  - Run `pnpm run ci` to verify all stages pass: lint → typecheck → test:coverage → build
  - Verify test coverage meets thresholds (lines/functions/statements ≥ 70%, branches ≥ 60%)
  - Verify build output exists: `dist/autokana.umd.js`, `dist/autokana.es.js`, `dist/index.d.ts`
  - Verify no TypeScript errors in the built type definitions
  - Check that no removed exports (`checkInterval`, `clearInterval`, etc.) appear in the type definitions
  - Verify `dist/index.d.ts` has no reference to removed properties

  **Must NOT do**:
  - Modify source code to fix failing tests (that should have been done in previous tasks)
  - Manually edit `dist/` files

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Simple verification, no code changes

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (final verification)
  - **Blocks**: F1-F4
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - `package.json` — scripts section for CI commands
  - `vitest.config.ts` — coverage thresholds configuration

  **WHY Each Reference Matters**:
  - CI commands must be understood to run them correctly
  - Coverage thresholds must be met for the CI to pass

  **Acceptance Criteria**:

  - [ ] `pnpm run ci` exits with code 0
  - [ ] All tests pass
  - [ ] Coverage thresholds met (≥70% lines/functions/statements, ≥60% branches)
  - [ ] Build outputs exist and are valid
  - [ ] No removed properties in type definitions

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full CI passes
    Tool: Bash
    Preconditions: All previous tasks complete
    Steps:
      1. Run `pnpm run ci`
      2. Verify exit code is 0
      3. Verify lint, typecheck, test:coverage, and build stages all pass
    Expected Result: Exit code 0, all stages pass
    Failure Indicators: Any stage fails, exit code non-zero
    Evidence: .sisyphus/evidence/task-8-ci-passes.txt

  Scenario: Build outputs are valid
    Tool: Bash
    Preconditions: Build completed
    Steps:
      1. Verify `dist/autokana.umd.js` exists and is non-empty
      2. Verify `dist/autokana.es.js` exists and is non-empty
      3. Verify `dist/index.d.ts` exists and contains `AutoKana`, `bind`, no removed properties
      4. Run `grep 'checkInterval\|clearInterval\|isConverting' dist/index.d.ts`
      5. Verify no matches (removed properties not in type definitions)
    Expected Result: All build outputs exist, type definitions are clean
    Failure Indicators: Missing files, removed properties in type definitions
    Evidence: .sisyphus/evidence/task-8-build-outputs.txt
  ```

  **Commit**: NO (verification only, all changes already committed in previous tasks)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `pnpm run typecheck` + `pnpm run lint` + `pnpm exec vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (composition events working together with focus/blur, with katakana conversion, etc.). Test edge cases: empty input, rapid consecutive conversions, paste input. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files unnecessarily. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Task 3**: `test(autokana): add composition event test suite (RED)` - __tests__/AutoKana.test.ts
- **Task 4+5**: `refactor(autokana): replace polling+keydown with composition events` - src/AutoKana.ts, src/index.ts
- **Task 6**: `fix(autokana): handle blur-during-composition edge case` - src/AutoKana.ts
- **Task 7**: `test(autokana): update existing tests for new event model` - __tests__/AutoKana.test.ts
- **Final**: `chore(autokana): verify CI passes` - (verification only)

---

## Success Criteria

### Verification Commands
```bash
pnpm exec vitest run __tests__/AutoKana.test.ts  # Expected: all tests pass
pnpm run typecheck                                # Expected: no errors
pnpm run lint                                     # Expected: no errors
pnpm run build                                    # Expected: clean build
pnpm run ci                                       # Expected: all stages pass
```

### Final Checklist
- [ ] All "Must Have" present (compositionstart/compositionend/input handlers, isComposing rename, polling removal, Chrome quirk, blur fallback)
- [ ] All "Must NOT Have" absent (no hybrid polling+composition, no isConverting/isComposing coexistence, no public API signature changes except checkInterval removal, no setTimeout/setInterval in tests)
- [ ] All tests pass
- [ ] Linux Chrome IME bug is fixed (verified by composition event test simulation)