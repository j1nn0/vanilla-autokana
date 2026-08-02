# Unify KatakanaOption into Literal Union Type

We changed `KatakanaOption` from `false | 'full' | 'half'` to `'hiragana' | 'full' | 'half'` and removed the boolean `false` variant. The default output mode also changed from `false` to `'hiragana'`. This is a breaking change shipped in a major version.

The boolean `false` was used to mean "output hiragana," which is surprising and prevents the type from being self-documenting. A literal union makes the intent obvious at every call site and improves IDE autocompletion. We rejected a gradual deprecation path (keeping `false` with a runtime warning) because the maintenance overhead outweighed the benefit for a focused utility library, and we preferred a clean API surface over an extended transition period.


## 2026-08-02 update: canonical kana state

`InputTracker` stores kana state and resync seeds as 正規かな (canonical hiragana). The
requested 出力形式 is applied only when formatting ふりがな, so changing between hiragana,
full-width katakana, and half-width katakana never changes the state representation.

We rejected storing formatted katakana in the tracker because the output option would become
part of the state and later format changes could not reliably recover the intended kana.