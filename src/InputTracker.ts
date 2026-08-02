import { compactKana, containsNonKana, extractKana } from './KanaExtractor';
import { canonicalizeKana, toKatakana } from './KanaConverter';
import type { KatakanaOption } from './KanaConverter';

/** Result of a single state transition: the current ふりがな and whether output notification is forced. */
export interface FuriganaResult {
  furigana: string;
  notify: boolean;
}

/**
 * IME conversion state machine: separates 確定かな (committed) from 未確定かな (pending)
 * and detects 変換 (conversion). AutoKana's DOM adapter owns the elements and events; the
 * tracker owns the output format and state transitions, while the adapter owns output policy.
 *
 * @internal Not part of the supported public API; not exported from the package entry.
 */
export class InputTracker {
  private committedKana = '';
  private pendingKana = '';
  private lastConvertedInput = '';
  private lastNewInput = '';
  private previousRawInput = '';
  private isComposing = false;

  constructor(private katakana: KatakanaOption) {}
  /** Return the output format currently owned by the tracker. */
  getKatakana(): KatakanaOption {
    return this.katakana;
  }

  /** Change the output format at runtime and return the current furigana in the new format. */
  setKatakana(katakana: KatakanaOption): FuriganaResult {
    this.katakana = katakana;
    return { furigana: this.formatFurigana(), notify: false };
  }

  /** Start an IME composition and return the current furigana. */
  startComposition(): FuriganaResult {
    this.isComposing = true;
    return { furigana: this.formatFurigana(), notify: false };
  }

  /** Track the current raw field value and return the resulting furigana. */
  trackInput(raw: string): FuriganaResult {
    if (raw === '') {
      return this.clearState(false);
    }

    const newInput = this.extractNewInput(raw);

    if (this.isComposing) {
      this.handleCompositionInput(newInput);
    } else {
      this.handleNormalInput(newInput, raw);
    }

    return { furigana: this.formatFurigana(), notify: false };
  }

  /**
   * End an IME composition and process the current raw value in one transition.
   */
  endComposition(raw: string): FuriganaResult {
    this.isComposing = false;
    this.lastNewInput = '';
    this.previousRawInput = '';
    return this.trackInput(raw);
  }

  /** End composition mode without changing the current kana. */
  blur(): FuriganaResult {
    this.isComposing = false;
    return { furigana: this.formatFurigana(), notify: false };
  }

  /**
   * Re-seed the tracker from the live DOM on focus: canonicalize the existing furigana to
   * 正規かな（Canonical Kana） before adopting it as committed kana, discard pending kana, and make
   * the current raw input the conversion baseline. Empty raw input clears all state (再同期 / resync).
   *
   * @param committedSeed The current furigana value to canonicalize and adopt as committed kana, or
   *   `undefined` when there is no furigana element (leaves committed kana untouched).
   */
  resync(raw: string, committedSeed: string | undefined): FuriganaResult {
    if (raw === '') {
      return this.clearState(false);
    }

    this.isComposing = false;
    if (committedSeed !== undefined) {
      this.committedKana = canonicalizeKana(committedSeed);
    }
    this.pendingKana = '';
    this.lastNewInput = '';
    this.previousRawInput = '';
    this.lastConvertedInput = raw;
    return { furigana: this.formatFurigana(), notify: false };
  }

  /** Clear all tracking state and force output notification for an explicit reset command. */
  reset(): FuriganaResult {
    return this.clearState(true);
  }

  private clearState(notify: boolean): FuriganaResult {
    this.isComposing = false;
    this.committedKana = '';
    this.pendingKana = '';
    this.lastConvertedInput = '';
    this.lastNewInput = '';
    this.previousRawInput = '';
    return { furigana: this.formatFurigana(), notify };
  }

  private formatFurigana(): string {
    return toKatakana(this.committedKana + this.pendingKana, this.katakana);
  }

  /**
   * Subtract the last converted (committed) portion of the raw input so that only the
   * not-yet-committed remainder is returned for kana extraction.
   *
   * Two strategies:
   * 1. If `lastConvertedInput` appears as a contiguous substring of the current input,
   *    slice it out. This is the common case (the committed kanji sits intact inside the
   *    field while the user keeps typing before/after it). An empty `lastConvertedInput`
   *    matches at index 0 and returns the input unchanged.
   * 2. Otherwise fall back to a positional charCode comparison, keeping only the
   *    characters that differ from `lastConvertedInput` at the same index. This handles
   *    cases where the committed text is no longer contiguous after an IME conversion.
   */
  private extractNewInput(newInput: string): string {
    const convertedIndex = newInput.indexOf(this.lastConvertedInput);
    if (convertedIndex !== -1) {
      return (
        newInput.slice(0, convertedIndex) +
        newInput.slice(convertedIndex + this.lastConvertedInput.length)
      );
    }

    let input = '';
    for (let i = 0; i < newInput.length; i += 1) {
      if (this.lastConvertedInput.charCodeAt(i) !== newInput.charCodeAt(i)) {
        input += newInput.charAt(i);
      }
    }
    return input;
  }

  /**
   * Decide whether the user just confirmed an IME conversion and, if so, move the
   * current pending kana (未確定かな) into committed kana (確定かな).
   *
   * Two heuristics signal a conversion:
   *
   * 1. **Large length jump** — the pending kana count changed by more than one in a single
   *    input event. A jump that big is not plain typing (which adds/removes one kana at a
   *    time); it means the IME replaced the reading with converted text. We skip the case
   *    where the new kana merely extends the old (`startsWith`), and re-check after kana
   *    compacting (小さなかな除去) so that small kana like っ/ゃ don't inflate the diff and
   *    cause a false positive.
   *
   * 2. **Same length, different content with non-kana present** — the pending kana count is
   *    unchanged but the raw last input now contains non-kana characters (e.g. kanji). That
   *    means the reading was converted in place, so commit it.
   */
  private detectAndCommitConversion(newPendingKana: string): void {
    if (Math.abs(this.pendingKana.length - newPendingKana.length) > 1) {
      if (!newPendingKana.startsWith(this.pendingKana)) {
        const compacted = compactKana(newPendingKana);
        if (Math.abs(this.pendingKana.length - compacted.length) > 1) {
          this.commitPendingKana();
        }
      }
    } else if (
      this.pendingKana.length === this.lastNewInput.length &&
      this.pendingKana !== this.lastNewInput
    ) {
      if (containsNonKana(this.lastNewInput)) {
        this.commitPendingKana();
      }
    }
  }

  private handleCompositionInput(newInput: string): void {
    const newPendingKana = extractKana(newInput);
    if (newPendingKana.length >= this.pendingKana.length) {
      this.pendingKana = newPendingKana;
    }
  }

  private handleNormalInput(newInput: string, rawInput: string): void {
    const isDeletion = rawInput.length < this.previousRawInput.length;
    this.lastNewInput = newInput;
    this.previousRawInput = rawInput;

    const newPendingKana = extractKana(newInput);

    if (!isDeletion) {
      const prevCommittedKana = this.committedKana;
      this.detectAndCommitConversion(newPendingKana);
      if (this.committedKana !== prevCommittedKana) {
        this.lastConvertedInput = rawInput;
        return;
      }
    }

    this.pendingKana = newPendingKana;
  }

  private commitPendingKana(): void {
    this.committedKana = this.committedKana + this.pendingKana;
    this.pendingKana = '';
  }
}
