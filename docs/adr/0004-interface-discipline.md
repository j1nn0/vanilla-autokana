# Interface Discipline: Supported Surface Only

The package's documented API is `bind()`, the `AutoKana` class, and the option types (ADR-0003). The v3.0.0 breaking set — recorded for users in the README migration guide — codifies the discipline behind that statement:

- **Read-only configuration.** `option` and `isActive` are read-only accessors over private backing state. Runtime changes go through explicit methods (`setKatakana()` for the output format; `start()` / `stop()` / `toggle()` for tracking on/off). A mutable public field invites silent no-ops: `option.katakana = 'full'` used to compile and do nothing, because the tracker captured the format at construction.
- **No DOM event shapes in the interface.** `toggle()` has no event parameter. A checkbox event belongs to the caller-side adapter, which maps `checked` directly to `start()` or `stop()`; its shape is not a package semver commitment.
- **No test-only public members.** `processValue()` and `setFurigana()` were public `@internal` seams that shipped in the type definitions. They are now private; tests exercise the real input-event path. The interface is the test surface, but the shipped interface is the supported surface — the two should not differ.
- **No compat aliases.** `initializeValues()` (deprecated alias of `reset()`) was removed; the README had already told users to use `reset()`. Aliases keep dead surface alive and force every future change to cover both names.
- **Uniform output policy.** `reset()` clears the furigana output (DOM element and onChange) through the same output policy as every other transition. The active gate belongs to DOM-driven input tracking, so explicit `reset()` and `setKatakana()` commands still reach the output while tracking is stopped.
- **Idempotent lifecycle.** `destroy()` is an absorbing teardown state: repeated destruction and state-changing methods after destruction are safe no-ops, while read accessors retain their last values. This keeps framework cleanup at the interface instead of making each adapter guard its own teardown.

We rejected keeping the mutable fields and the `@internal` seams "for convenience": every public member is a semver commitment (ADR-0003), and a silent no-op is worse than a loud compile error.
