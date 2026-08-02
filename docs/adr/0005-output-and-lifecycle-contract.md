# Output and Lifecycle Contract

`stop()` pauses only DOM-driven input tracking; explicit `reset()` and `setKatakana()` transitions still update the furigana output and `onChange`, so the tracker and DOM cannot become permanently desynchronized. `destroy()` is an absorbing, idempotent teardown state: repeated destruction and state-changing methods after destruction are safe no-ops, while read accessors retain their last values. `InputTracker` is the sole owner of `KatakanaOption`; `AutoKana.option` derives its `katakana` value from the tracker rather than storing a second copy.

We rejected keeping the active gate in the output policy because it makes explicit commands silently disappear while stopped. We rejected a destroy contract that requires every adapter to prevent repeated cleanup because framework lifecycles commonly repeat teardown. We rejected keeping `katakana` in both modules because synchronization would remain an implementation convention instead of a structural invariant.

Consequences: DOM event handlers must check the tracking state before invoking tracker transitions; explicit commands bypass that gate; `destroy()` releases DOM references and blocks later state changes; the public option view is assembled from adapter-owned callbacks/debug settings and the tracker-owned output format.
