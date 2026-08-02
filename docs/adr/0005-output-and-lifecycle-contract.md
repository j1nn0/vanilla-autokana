# Output and Lifecycle Contract

`stop()` pauses only DOM-driven input tracking; explicit `reset()` and `setKatakana()` transitions still update the furigana output and `onChange`, so the tracker and DOM cannot become permanently desynchronized. `destroy()` is an absorbing, idempotent teardown state: repeated destruction and state-changing methods after destruction are safe no-ops, while read accessors retain their last values. `InputTracker` is the sole owner of `KatakanaOption`; `AutoKana.option` derives its `katakana` value from the tracker rather than storing a second copy.

We rejected keeping the active gate in the output policy because it makes explicit commands silently disappear while stopped. We rejected a destroy contract that requires every adapter to prevent repeated cleanup because framework lifecycles commonly repeat teardown. We rejected keeping `katakana` in both modules because synchronization would remain an implementation convention instead of a structural invariant.

Consequences: DOM event handlers must check the tracking state before invoking tracker transitions; explicit commands bypass that gate; `destroy()` releases DOM references and blocks later state changes; the public option view is assembled from adapter-owned callbacks/debug settings and the tracker-owned output format.

## 2026-08-02 update: output notification intent

Each `InputTracker` transition returns the current ふりがな and an explicit output-notification
intent. Ordinary input, empty-input clearing, resync, and format changes use deduplicated
delivery; an explicit `reset()` sets the intent so the adapter delivers one DOM `input` event
and one `onChange` callback even when the value is already empty.

We rejected using the state-cleared flag for notification policy because empty input and an
explicit reset are different commands at the output seam.
