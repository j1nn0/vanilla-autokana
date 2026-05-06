# Changelog

## Unreleased

### Added

- IME composition event handling (`compositionstart`, `compositionend`, `input`). Replaces the polling-based approach for more reliable detection of Japanese IME conversion across browsers, especially fixing a long-standing bug on Linux Chrome + ibus/fcitx where furigana would freeze after kanji conversion.
- Chrome quirk handling: `compositionend` explicitly triggers furigana processing because Chrome may not fire a subsequent `input` event with `isComposing=false`.
- Blur-during-composition fallback: `isComposing` flag is reset on blur to prevent stale state when `compositionend` is not fired.
- Composition event test suite (20 tests) covering: composition flow, Chrome quirk, focus/blur integration, paste, consecutive IME conversions, edge cases.
- Half-width katakana output option (`katakana: 'half'`) with full conversion map including `ヰ`, `ヱ`, `ヺ`, `。`, `、`.
- Full-width katakana output option (`katakana: 'full'`).
- Public `destroy()` method to remove event listeners and clear the polling interval.
- `getFurigana()` method for Vue/React controlled-input integration.
- CSS selector support for `bind()` / `new AutoKana()`: class selectors (`.class`), attribute selectors (`[name="foo"]`), and other `querySelector`-compatible selectors now work alongside bare IDs and `#id` selectors.
- Coverage support in Vitest and quality-gate scripts (`test:coverage`, `ci`).
- Storybook demo with `@storybook/html-vite`.
- Contributor guidance file (`AGENTS.md`).
- Dependabot configuration for npm.
- Security policy (`SECURITY.md`).

### Changed

- **Breaking:** Removed `checkInterval` option from `AutoKanaOption`. Polling-based input monitoring has been replaced by event-driven composition event handling.
- **Breaking:** Renamed internal `isConverting` property to `isComposing` and `onInput()` method to `processValue()`.
- Replaced polling mechanism (`setInterval`, `clearInterval`, `checkValue`) with composition event handlers (`compositionstart`, `compositionend`, `input`).
- `AutoKanaOption` interface simplified to `katakana` and `debug` only.
- Focus/blur handlers no longer manage a polling interval; blur resets `isComposing` flag as a safety fallback.
- **Breaking:** Replaced `halfWidthKatakana: boolean` with `katakana: false | 'full' | 'half'`.
- Migrated the entire codebase from JavaScript to TypeScript.
- Switched build system from Webpack to Vite (UMD + ES modules + d.ts).
- Improved type safety: `timer` field now uses `ReturnType<typeof setInterval>` instead of `number | null` with unsafe cast.
- Removed the definite assignment assertion (`!`) on `elName` by introducing a `requireElement()` helper.
- Removed redundant `String()` wrapper in `removeString()`.
- Clarified `toKatakana` conversion priority and simplified `setInterval` implementation.
- Documented the fallback behavior of half-width katakana conversion (unmapped characters are left unchanged).
- Added JSDoc to `onInput()` and `onConvert()` to clarify their roles in the conversion state machine.
- Updated package metadata for publication readiness (scope `@j1nn0`, description, repository, bugs, homepage, contributors).
- Aligned type declaration module name with the published package name `@j1nn0/vanilla-autokana`.
- Updated Node.js engine requirement to `>=24` and pinned `pnpm@10.33.2`.
- Added `.editorconfig`, `.oxlintrc.json`, `.oxfmtrc.json`, `.npmrc`, `pnpm-workspace.yaml`, `mise.toml`, VSCode settings.

### Fixed

- Full-width space normalization now applies only in half-width katakana mode.
- Timer/event lifecycle improvements to avoid stale interval state issues.
- Linux Chrome + ibus/fcitx IME: furigana no longer freezes after kanji conversion. Subsequent hiragana input after IME conversion is now correctly reflected in the furigana field.
- Removed `isComposing` guard from `setFurigana()` so that furigana updates in real time during IME composition (previously blocked until `compositionend`, causing sluggish feedback).

### Tests

- Unified test setup with `setup()` helper across all test cases.
- Added tests for full-width-space behavior in half-width mode.
- Added integration tests for focus/blur timer lifecycle and keydown conversion reset.
- Added tests for `initializeValues()`, `debug()`, `onInput()`, `onConvert()`, `checkValue()`, and `destroy()` event listener removal.
- Improved test readability by fixing misleading variable names in toggle tests.
- Coverage: Statements 92%, Branches 75%, Functions 100%, Lines 93%.
- Replaced 8 polling-specific tests (`clearInterval`, `setInterval`, `checkValue`, `checkConvert`, `removeString`) with 20 composition event tests.
- Updated 12 existing tests for the new event-driven model (`isConverting` → `isComposing`, `onInput` → `processValue`).
- Fixed composition tests to expect real-time furigana updates during IME composition (removed incorrect assertions that `isComposing` should block updates).
- Added edge case tests: paste input, consecutive IME conversions, empty input after composition, blur-during-composition reset.

### Docs

- Updated README (ja/en) examples to reflect the new `katakana` API.
- Expanded option documentation (`katakana`, `checkInterval`) and framework integration guidance (Vue, React).
- Aligned script-tag examples with `dist/autokana.umd.js`.
- Added clear fork attribution and copyright notes.
- Removed `checkInterval` option from README (ja/en) and AGENTS.md (option no longer exists).

### Build/Tooling

- Added Vite/Vitest project configuration.
- Updated lint/format tooling configuration (`.oxlintrc.json`, `.oxfmtrc.json`).
- Removed legacy demo files (`autokana.js`, `index.html`).