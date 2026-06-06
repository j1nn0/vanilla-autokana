# AutoKana Domain

A library that automatically generates furigana from Japanese name input fields, tracking the boundary between committed and pending kana to provide real-time output during IME composition.

## Language

**確定かな（Committed Kana）**:
Kana characters that have already been confirmed through past IME conversions. Accumulated and never re-processed during ongoing composition.
_同義語を避ける_: baseKana, base

**未確定かな（Pending Kana）**:
Kana characters extracted from the current raw input that have not yet been confirmed by an IME conversion. May change or be discarded during composition.
_同義語を避ける_: values, temporaryKana

**ふりがな（Furigana）**:
The final output string displayed to the user, composed of committed kana plus pending kana, optionally converted to katakana.
_同義語を避ける_: output, result

**変換（Conversion）**:
The IME action that turns pending kana into committed kanji/kana. In this library, it triggers moving pending kana into committed kana.
_同義語を避ける_: commit, finalize

**入力追跡（Input Tracking）**:
The mechanism that compares the current raw input against previously seen input to detect what the user actually typed versus what the IME composed.
_同義語を避ける_: input processing, value processing

**かな抽出（Kana Extraction）**:
The process of filtering a raw input string to retain only kana characters (including spaces), discarding kanji, romaji, and other symbols.
_同義語を避ける_: kana filtering, input cleaning

**小さなかな除去（Kana Compacting）**:
The process of removing small kana characters (ぁぃぅぇぉっゃゅょ) from a string to normalize it for length comparison during conversion detection.
_同義語を避ける_: small kana stripping, kana normalization

## Example Dialogue

> **開発者**: 「確定かな」と「未確定かな」の境界はどこで決まりますか？
>
> **ドメインエキスパート**: ユーザーが変換を確定（Enterやスペース）した時点で、未確定かなは確定かなに移動します。それまでは未確定かなとして保持され、リアルタイムでふりがなとして表示されます。
>
> **開発者**: 変換中に候補をブラウズすると、未確定かなが減ることがありますが、その場合どうなりますか？
>
> **ドメインエキスパート**: 候補ブラウズ中は未確定かなが減っても、既存の未確定かなを維持します。候補ブラウズは一時的な表示変更で、ユーザーが確定するまでは既存のかなを保持し続けるべきです。
