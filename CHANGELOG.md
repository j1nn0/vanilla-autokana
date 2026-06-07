# Changelog

## Unreleased

## 2.0.0

### Breaking Changes

- **API: `katakana` option type changed.** `false` is no longer accepted. Use `'hiragana'` for hiragana output (default). Migration: `katakana: false` → `katakana: 'hiragana'`.
- **Internal rename: `toKatakana()` removed from public API.** `AutoKana#toKatakana()` is no longer public. Use `KanaConverter.toKatakana(src, option)` directly.
- **Internal rename: `baseKana` → `committedKana`, `values` → `pendingKana`, `input` → `lastNewInput`, `ignoreString` → `lastConvertedInput`, `onConvert` → `commitPendingKana`, `checkConvert` → `detectAndCommitConversion`, `removeString` → `extractNewInput`.** These are internal-only changes but may affect consumers who accessed them via `@ts-ignore`.

### Added

- `KanaExtractor` class for pure kana extraction and compaction logic.
- `KanaConverter` class for pure hiragana-to-katakana conversion logic.
- `containsNonKana()` utility method in `KanaExtractor`.
- `CONTEXT.md` and `docs/adr/0001-katakana-type-unification.md` for domain terminology and architecture decisions.

### Changed

- `AutoKanaOption` interface: `katakana` and `debug` are now optional at the public API level (defaults applied internally).
- `setFurigana()` no longer accepts `newValues` parameter; state updates are explicit at call sites.
- `debug()` method is now `private`.
- `processValue()` split into `handleCompositionInput()` and `handleNormalInput()` for clearer responsibilities.

### Fixed

- CommonJS package entry now points to a dedicated `dist/autokana.cjs` build instead of the browser UMD bundle.
- `KanaExtractor.containsNonKana()` now uses `search()` instead of `test()` to avoid `lastIndex` mutation bugs with global regex.

### Tests

- Added `KanaExtractor` unit tests (extract, compact, containsNonKana).
- Added `KanaConverter` unit tests (toKatakana for half/full/hiragana modes).
- Added package export smoke checks for ESM and CommonJS builds.
- Removed direct `AutoKana#toKatakana()` tests in favor of `KanaConverter` tests.

### Build/Tooling

- Build now emits separate ES module, CommonJS, and UMD artifacts.
- Publish checks now use one-shot coverage tests instead of Vitest watch mode.
- CI now validates package exports, dry-run package contents, package metadata, and published type resolution.
- TypeScript configuration now checks published declarations with `isolatedDeclarations`.

## Unreleased

### Added

- IME composition event handling (`compositionstart`, `compositionend`, `input`). Replaces the polling-based approach for more reliable detection of Japanese IME conversion across browsers, especially fixing a long-standing bug on Linux Chrome + ibus/fcitx where furigana would freeze after kanji conversion.
- Chrome quirk handling: `compositionend` explicitly triggers furigana processing because Chrome may not fire a subsequent `input` event with `isComposing=false`.
- Blur-during-composition fallback: `isComposing` flag is reset on blur to prevent stale state when `compositionend` is not fired.
- Composition event test suite (20 tests) covering: composition flow, Chrome quirk, focus/blur integration, paste, consecutive IME conversions, edge cases.
- Half-width katakana output option (`katakana: 'half'`) with full conversion map including `ヰ`, `ヱ`, `ヺ`, `。`, `、`.
- Full-width katakana output option (`katakana: 'full'`).
- Public `destroy()` method to remove event listeners.
- `getFurigana()` method for Vue/React controlled-input integration.
- Selector support for `bind()` / `new AutoKana()`: strings starting with `#`, `.`, `[`, or `:` are resolved via `querySelector()`, while bare strings continue to work as IDs for backward compatibility.
- Coverage support in Vitest and quality-gate scripts (`test:coverage`, `ci`).
- Storybook demo with `@storybook/html-vite`.
- React and Vue Storybook demo stories with interactive framework integration examples.
- Contributor guidance file (`AGENTS.md`).
- Dependabot configuration for npm.
- Security policy (`SECURITY.md`).

### Changed

- **Breaking:** Removed `checkInterval` option from `AutoKanaOption`. Polling-based input monitoring has been replaced by event-driven composition event handling.
- **Breaking:** Renamed internal `isConverting` property to `isComposing` and `onInput()` method to `processValue()`.
- Replaced polling mechanism (`setInterval`, `clearInterval`, `checkValue`) with composition event handlers (`compositionstart`, `compositionend`, `input`).
- `AutoKanaOption` interface updated around the event-driven model and now exposes `katakana`, `debug`, and `onChange`.
- Focus/blur handlers no longer manage a polling interval; blur resets `isComposing` flag as a safety fallback.
- Focus handling now clears transient conversion buffers on re-focus to avoid double-counting previously processed kana.
- **Breaking:** Replaced `halfWidthKatakana: boolean` with `katakana: 'hiragana' | 'full' | 'half'`.
- Migrated the entire codebase from JavaScript to TypeScript.
- Switched build system from Webpack to Vite (UMD + ES modules + d.ts).
- Improved element resolution/type safety around `requireElement()` and selector handling.
- Removed the definite assignment assertion (`!`) on `elName` by introducing a `requireElement()` helper.
- Removed redundant `String()` wrapper in `removeString()`.
- Clarified `toKatakana` conversion priority and half-width fallback behavior.
- Documented the fallback behavior of half-width katakana conversion (unmapped characters are left unchanged).
- Added JSDoc to exported APIs and conversion-related methods to clarify their roles in the conversion state machine.
- Updated package metadata for publication readiness (scope `@j1nn0`, description, repository, bugs, homepage, contributors).
- Aligned type declaration module name with the published package name `@j1nn0/vanilla-autokana`.
- Updated Node.js engine requirement to `>=24` and pinned `pnpm@10.34.1`.
- Added `.editorconfig`, `.oxlintrc.json`, `.oxfmtrc.json`, `.npmrc`, `pnpm-workspace.yaml`, `mise.toml`, VSCode settings.

### Fixed

- Full-width space normalization now applies only in half-width katakana mode.
- Timer/event lifecycle improvements to avoid stale interval state issues.
- Linux Chrome + ibus/fcitx IME: furigana no longer freezes after kanji conversion. Subsequent hiragana input after IME conversion is now correctly reflected in the furigana field.
- Removed `isComposing` guard from `setFurigana()` so that furigana updates in real time during IME composition (previously blocked until `compositionend`, causing sluggish feedback).
- IME candidate browsing no longer duplicates furigana when the input temporarily changes between kana and kanji during composition.
- `ignoreString` is now updated after conversion so already-processed text is not counted again.

### Tests

- Unified test setup with `setup()` helper across all test cases.
- Added tests for full-width-space behavior in half-width mode.
- Added integration tests for focus/blur behavior and conversion reset.
- Added tests for `initializeValues()`, `debug()`, `processValue()`, `onConvert()`, `checkConvert()`, and `destroy()` event listener removal.
- Improved test readability by fixing misleading variable names in toggle tests.
- Coverage: Statements 92%, Branches 75%, Functions 100%, Lines 93%.
- Replaced 8 polling-specific tests (`clearInterval`, `setInterval`, `checkValue`, `checkConvert`, `removeString`) with 20 composition event tests.
- Updated 12 existing tests for the new event-driven model (`isConverting` → `isComposing`, `onInput` → `processValue`).
- Fixed composition tests to expect real-time furigana updates during IME composition (removed incorrect assertions that `isComposing` should block updates).
- Added edge case tests: paste input, consecutive IME conversions, empty input after composition, blur-during-composition reset.
- Added regression tests for IME candidate browsing, re-focus after conversion, and full-width space handling.

### Docs

- Updated README (ja/en) examples to reflect the new `katakana` API.
- Expanded option documentation (`katakana`, `onChange`) and framework integration guidance (Vue, React).
- Aligned script-tag examples with `dist/autokana.umd.js`.
- Added clear fork attribution and copyright notes.
- Removed `checkInterval` option from README (ja/en) and AGENTS.md (option no longer exists).
- Synced README / README_en and AGENTS guidance with the latest IME fixes and framework demo coverage.

### Build/Tooling

- Added Vite/Vitest project configuration.
- Updated lint/format tooling configuration (`.oxlintrc.json`, `.oxfmtrc.json`).
- Updated development dependencies including `jsdom` and `oxlint`.
- Improved CI workflow configuration: explicit permissions, simplified Node.js setup, and removed duplicate Corepack enablement.
- Stopped tracking `.sisyphus` workspace artifacts in version control.
- Removed legacy demo files (`autokana.js`, `index.html`).
