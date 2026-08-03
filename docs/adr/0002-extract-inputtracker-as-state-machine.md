# Extract IME State Machine into InputTracker

The IME conversion logic (確定かな accumulation, 未確定かな tracking, 変換 detection) was extracted from `AutoKana` into a separate `InputTracker` class, leaving `AutoKana` as a thin DOM adapter. `InputTracker` owns all kana state and the conversion heuristics; `AutoKana` owns the DOM elements, event listeners, and output policy (isActive / dedup / onChange dispatch).

The key driver was testability: the state machine can now be exercised with plain string inputs in unit tests, without DOM setup or event simulation. The alternative — keeping everything in `AutoKana` — worked but forced all IME-logic tests to go through the DOM, making them slower, harder to read, and sensitive to event ordering details that have nothing to do with the kana state transitions being tested.

We considered keeping the extraction shallow (just moving fields, no new class boundary) and rejected it because it provides no isolation — callers can still reach into the fields and the test surface remains identical to the monolith.

## 2026-08-01 update: complete the lifecycle ownership

The state machine was deepened to own the composition lifecycle as well. `isComposing` moved from `AutoKana` into `InputTracker`; the interface is now a set of semantic transitions — `startComposition()`, `trackInput(raw)`, `endComposition(raw)`, `blur()`, `resync(raw, committedSeed?)`, `reset()` — each of which returns the current furigana. This removes the caller-side ordering constraints (`endComposition` → `update` and `resync` → `update`) from the seam. `AutoKana` maps each DOM event to exactly one transition and feeds the returned furigana into its existing output policy (isActive / dedup / onChange dispatch). Empty raw input is handled inside `trackInput()` / `resync()` rather than by the adapter. Public behavior and the supported public interface were unchanged.

## 2026-08-03 update: conversion detection extraction

`isComposing` and the input-comparison state (`lastConvertedInput` / `lastNewInput` / `previousRawInput`) moved out of `InputTracker` into the new internal `ConversionDetector` seam (ADR-0006). `InputTracker` remains the kana state machine: it owns 確定かな / 未確定かな / 出力形式 and maps each transition to a furigana result, while the detector owns composition mode, the tracking baseline, and the conversion heuristics.
