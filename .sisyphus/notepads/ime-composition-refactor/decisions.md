# Decisions — ime-composition-refactor

## checkInterval removal
- DECIDED: Remove completely from AutoKanaOption. Breaking change.
- Users passing `{ checkInterval: N }` will get no effect — option is simply no longer accepted.
- Documentation (README) should be updated to remove checkInterval references.

## isConverting → isComposing rename
- DECIDED: Full rename, no coexistence. Both isConverting and isComposing must never appear in the same file at the same time.

## Polling removal approach
- DECIDED: Full removal. No hybrid approach. No setTimeout fallback.
- setInterval, clearInterval, timer, checkValue, checkConvert, removeString, ignoreString, input — all removed.

## Composition event strategy
- DECIDED: compositionstart/compositionend/input event handlers
- Chrome quirk: compositionend handler explicitly calls processValue()
- blur handler resets isComposing as fallback (compositionend may not fire on blur)
