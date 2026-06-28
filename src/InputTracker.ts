import { KanaExtractor } from './KanaExtractor';
import { KanaConverter } from './KanaConverter';
import type { KatakanaOption } from './AutoKana';

/**
 * IME conversion state machine: separates 確定かな (committed) from 未確定かな (pending)
 * and detects 変換 (conversion). AutoKana's DOM adapter owns the elements, events, and
 * output policy (isActive/dedup/onChange).
 *
 * @internal Not part of the supported public API; not exported from the package entry.
 */
export class InputTracker {
  private committedKana = '';
  private pendingKana: string[] = [];
  private lastConvertedInput = '';
  private lastNewInput = '';
  private previousRawInput = '';

  constructor(private readonly katakana: KatakanaOption) {}

  /**
   * Feed the current raw field value and composition flag, advancing the state machine.
   *
   * @param raw The full value of the name field.
   * @param isComposing Whether an IME composition is in progress.
   */
  update(raw: string, isComposing: boolean): void {
    const newInput = this.extractNewInput(raw);

    if (isComposing) {
      this.handleCompositionInput(newInput);
      return;
    }

    this.handleNormalInput(newInput, raw);
  }

  /**
   * Reset the input-tracking flags at the end of an IME composition so the next
   * {@link update} runs the full non-composition path (変換 detection, commit, etc.).
   * The accumulated pending kana are intentionally kept so they can still be committed.
   */
  endComposition(): void {
    this.lastNewInput = '';
    this.previousRawInput = '';
  }

  /**
   * Re-seed the tracker from the live DOM on focus: adopt the existing furigana as already
   * committed kana, treat the current raw value as already converted, and clear pending state.
   *
   * @param raw The current value of the name field.
   * @param committedSeed The current furigana value to adopt as committed kana, or `undefined`
   *   when there is no furigana element (leaves committed kana untouched).
   */
  resync(raw: string, committedSeed: string | undefined): void {
    if (committedSeed !== undefined) {
      this.committedKana = committedSeed;
    }
    this.pendingKana = [];
    this.lastNewInput = '';
    this.previousRawInput = '';
    this.lastConvertedInput = raw;
  }

  /** Clear all tracking state (committed kana, pending kana, and the diff anchors). */
  reset(): void {
    this.committedKana = '';
    this.pendingKana = [];
    this.lastConvertedInput = '';
    this.lastNewInput = '';
    this.previousRawInput = '';
  }

  /** The current furigana string in the configured output format. */
  getFurigana(): string {
    return KanaConverter.toKatakana(this.committedKana + this.pendingKana.join(''), this.katakana);
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
  private detectAndCommitConversion(newPendingKana: string[]): void {
    if (Math.abs(this.pendingKana.length - newPendingKana.length) > 1) {
      const oldKana = this.pendingKana.join('');
      const newKana = newPendingKana.join('');
      if (!newKana.startsWith(oldKana)) {
        const compacted = KanaExtractor.compact(newKana).split('');
        if (Math.abs(this.pendingKana.length - compacted.length) > 1) {
          this.commitPendingKana();
        }
      }
    } else if (
      this.pendingKana.length === this.lastNewInput.length &&
      this.pendingKana.join('') !== this.lastNewInput
    ) {
      if (KanaExtractor.containsNonKana(this.lastNewInput)) {
        this.commitPendingKana();
      }
    }
  }

  private handleCompositionInput(newInput: string): void {
    const newPendingKana = KanaExtractor.extract(newInput);
    if (newPendingKana.length >= this.pendingKana.length) {
      this.pendingKana = newPendingKana;
    }
  }

  private handleNormalInput(newInput: string, rawInput: string): void {
    if (this.lastNewInput === newInput) return;

    const isDeletion = rawInput.length < this.previousRawInput.length;
    this.lastNewInput = newInput;
    this.previousRawInput = rawInput;

    const newPendingKana = KanaExtractor.extract(newInput);

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
    this.committedKana = this.committedKana + this.pendingKana.join('');
    this.pendingKana = [];
  }
}
