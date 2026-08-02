# AutoKana Domain

A library that automatically generates furigana from Japanese name input fields, tracking the boundary between committed and pending kana to provide real-time output during IME composition.

## Language

**確定かな（Committed Kana）**:
Kana characters that have already been confirmed through past IME conversions. Accumulated and never re-processed during ongoing composition.
_同義語を避ける_: baseKana, base

**正規かな（Canonical Kana）**:
The neutral hiragana representation used for kana state. ふりがな is converted from 正規かな only when applying the 出力形式（Output Format）; full-width and half-width katakana are not stored as the state representation.
_同義語を避ける_: normalized kana, internal kana

**未確定かな（Pending Kana）**:
Kana characters extracted from the current raw input that have not yet been confirmed by an IME conversion. May change or be discarded during composition.
_同義語を避ける_: values, temporaryKana

**ふりがな（Furigana）**:
The final output string displayed to the user, composed of committed kana plus pending kana, converted according to the 出力形式（Output Format）.
_同義語を避ける_: output, result

**出力通知（Output Notification）**:
The delivery of a changed ふりがな to the output element and the `onChange` callback. Ordinary input is deduplicated when the value is unchanged; an explicit reset still forces one notification so consumers can observe the command.
_同義語を避ける_: output event, change callback

**出力形式（Output Format）**:
The character form of the generated furigana: hiragana (default), full-width katakana, or half-width katakana. Controlled by the `katakana` option; represented as `KatakanaOption` in the code and owned by the kana conversion module.
_同義語を避ける_: katakana option, output mode

**変換（Conversion）**:
The IME action that turns pending kana into committed kanji/kana. In this library, it triggers moving pending kana into committed kana.
_同義語を避ける_: commit, finalize

**入力追跡（Input Tracking）**:
The mechanism that compares the current raw input against previously seen input to detect what the user actually typed versus what the IME composed.
_同義語を避ける_: input processing, value processing

**追跡停止（Tracking Pause）**:
The temporary state in which DOM input and IME events are ignored while explicit commands such as reset and output-format changes remain available.
_同義語を避ける_: disabled, inactive mode

**再同期（Resync）**:
Re-aligning the tracker's state with the live DOM when the name field receives focus. All pending state is discarded and the current raw input becomes the new conversion baseline. If a furigana element is present, its current value is canonicalized to 正規かな before being adopted as committed kana; otherwise committed kana is left as-is.
_同義語を避ける_: reload, reinitialize, refresh

**かな抽出（Kana Extraction）**:
The process of filtering a raw input string to retain kana (hiragana, full-width katakana, half-width katakana, iteration marks, long-vowel marks, and spaces), canonicalizing accepted kana to 正規かな, and discarding kanji, romaji, and other symbols.
_同義語を避ける_: kana filtering, input cleaning

**小さなかな除去（Kana Compacting）**:
The process of removing small kana characters (ぁぃぅぇぉっゃゅょ) from a string to canonicalize it for length comparison during conversion detection.
_同義語を避ける_: small kana stripping, kana normalization

## Example Dialogue

> **開発者**: 「確定かな」と「未確定かな」の境界はどこで決まりますか？
>
> **ドメインエキスパート**: ユーザーが変換を確定（Enterやスペース）した時点で、未確定かなは確定かなに移動します。それまでは未確定かなとして保持され、リアルタイムでふりがなとして表示されます。
>
> **開発者**: 変換中に候補をブラウズすると、未確定かなが減ることがありますが、その場合どうなりますか？
>
> **ドメインエキスパート**: 候補ブラウズ中は未確定かなが減っても、既存の未確定かなを維持します。候補ブラウズは一時的な表示変更で、ユーザーが確定するまでは既存のかなを保持し続けるべきです。
