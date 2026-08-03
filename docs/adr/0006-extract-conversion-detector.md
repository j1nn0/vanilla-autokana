# Extract Conversion Detection into ConversionDetector

The IME conversion heuristics (入力追跡 / Input Tracking and 変換検出 / Conversion Detection) were extracted from `InputTracker` into a stateful internal `ConversionDetector` class, leaving `InputTracker` as the kana state machine (確定かな / 未確定かな / 出力形式) with thin transition wiring.

## Context

`InputTracker` owned the composition lifecycle, the tracking comparison state (`lastConvertedInput`, `lastNewInput`, `previousRawInput`), and two conversion heuristics (large length jump with kana compacting; same-length non-kana replacement), while its helper functions `compactKana` and `containsNonKana` lived in `KanaExtractor` under the banner of a different domain concept (かな抽出). Understanding 変換検出 required crossing two module seams, and the riskiest branch — the positional charCode fallback in `extractNewInput` — was only reachable through long IME event sequences in tests.

## Decision

- Extract a stateful `ConversionDetector` that owns `isComposing`, `lastConvertedInput`, `lastNewInput`, and `previousRawInput`, plus the full input-processing pipeline: extraction, deletion detection, the composition keep-longest rule, and both conversion heuristics.
- Its `track(raw, pendingKana)` returns the pending kana to adopt and whether a conversion committed. `InputTracker` applies the decision: on commit, append the previous pending kana to 確定かな and adopt the returned (empty) pending kana.
- `compactKana` and `containsNonKana` move from `KanaExtractor` into the `ConversionDetector` module.
- `InputTracker` keeps 確定かな / 未確定かな / 出力形式 and the transition-to-furigana mapping. Its name, interface, and the supported public API are unchanged (ADR-0004: internal seam, no public surface change).

## Alternatives rejected

- **Pure decision function**: extracting the heuristics without the tracking state would leave the reset-ordering invariants in `InputTracker`, moving complexity instead of concentrating it. The detection state is where the invariants live.
- **Detector owning 未確定かな**: the kana state is the state machine's core contract (ADR-0002) and would have been split across two owners, with an accessor needed for formatting.
- **Keeping the helpers in `KanaExtractor`**: the seam between かな抽出 and 変換検出 would have remained smeared across two modules.
- **No extraction (relocating helpers only)**: fixes the helper placement but leaves the heuristic branches reachable only through long event sequences, keeping the test surface weak.

## Consequences

- 変換検出 has one home: heuristic branches are directly testable with plain string inputs (`__tests__/ConversionDetector.test.ts`) instead of full IME event sequences.
- `InputTracker` transitions are thin wiring; the state-machine invariants become explicit parameters of the detector interface.
- Test files: `ConversionDetector.test.ts` added; `InputTracker.test.ts` shrunk to transition semantics; the DOM-facing tests (`AutoKana.test.ts`, `AutoKana.ime.test.ts`) are unchanged.
- ADR-0002's 2026-08-01 statement that `InputTracker` owns the composition lifecycle is superseded: composition mode is now tracked by the detector.
