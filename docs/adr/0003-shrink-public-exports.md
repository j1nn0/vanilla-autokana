# Shrink the Public Exports to the Supported bind() Surface

`KanaConverter` and `KanaExtractor` were exported from the package entry (`index.ts`) but never documented in the README, which presents only `bind()` (plus the `AutoKana` class and its option types) as the supported API. The two utilities are implementation details of the furigana pipeline: they stay as internal modules, but are no longer part of the public interface, so the library can change their shape (e.g. `KanaExtractor.extract()` returning a kana string instead of a character array) without a semver commitment.

This is a breaking change for any consumer who imported these utilities directly; it ships in a major version, following the precedent of ADR-0001.

We rejected keeping the exports "just in case" because every public export is a compatibility commitment: it constrains internal refactors (the deletion test) and forces semver majors for internal cleanups. Consumers who need standalone kana conversion should use a dedicated library.
