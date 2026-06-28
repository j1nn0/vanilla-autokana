# Extract IME State Machine into InputTracker

The IME conversion logic (確定かな accumulation, 未確定かな tracking, 変換 detection) was extracted from `AutoKana` into a separate `InputTracker` class, leaving `AutoKana` as a thin DOM adapter. `InputTracker` owns all kana state and the conversion heuristics; `AutoKana` owns the DOM elements, event listeners, and output policy (isActive / dedup / onChange dispatch).

The key driver was testability: the state machine can now be exercised with plain string inputs in unit tests, without DOM setup or event simulation. The alternative — keeping everything in `AutoKana` — worked but forced all IME-logic tests to go through the DOM, making them slower, harder to read, and sensitive to event ordering details that have nothing to do with the kana state transitions being tested.

We considered keeping the extraction shallow (just moving fields, no new class boundary) and rejected it because it provides no isolation — callers can still reach into the fields and the test surface remains identical to the monolith.
