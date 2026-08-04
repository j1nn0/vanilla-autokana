import { containsUnsupportedKana, extractKana } from './KanaExtractor';

// Small kana removed from 正規かな to compare lengths during conversion detection. The input
// has already passed through かな抽出 (Kana Extraction), so canonicalization is not repeated.
// They are appended to a preceding kana during typing, so counting them would distort the
// length diff used by detectAndCommitConversion (小さなかな除去 / Kana Compacting).
const COMPACTING_PATTERN = /[ぁぃぅぇぉっゃゅょ]/g;

/**
 * 小さなかな除去 (Kana Compacting): remove small kana characters (ぁぃぅぇぉっゃゅょ) from a
 * string to canonicalize it for length comparison during conversion detection.
 */
export function compactKana(input: string): string {
  return input.replace(COMPACTING_PATTERN, '');
}

/** Result of tracking one raw input: the pending kana to adopt and whether a conversion committed. */
interface TrackResult {
  pendingKana: string;
  commit: boolean;
}

/**
 * IME input tracking and conversion detection: owns the comparison of the current raw input
 * against previously seen input (入力追跡) and the heuristics that detect a confirmed IME
 * conversion (変換検出). The kana state machine (`InputTracker`) owns 確定かな / 未確定かな and
 * applies the returned decision: on commit, append the previous pending kana to committed kana.
 *
 * @internal Not part of the supported public API; not exported from the package entry.
 */
export class ConversionDetector {
  private isComposing = false;
  private lastConvertedInput = '';
  private lastNewInput = '';
  private previousRawInput = '';

  /** Start an IME composition. */
  startComposition(): void {
    this.isComposing = true;
  }

  /** End composition mode without changing the tracking state. */
  blur(): void {
    this.isComposing = false;
  }

  /**
   * End composition mode and reset the tracking baseline so that the final value is
   * processed fresh by the following `track` call.
   */
  endComposition(): void {
    this.isComposing = false;
    this.lastNewInput = '';
    this.previousRawInput = '';
  }

  /** Re-seed the tracking baseline from the live DOM on focus. */
  resync(raw: string): void {
    this.isComposing = false;
    this.lastNewInput = '';
    this.previousRawInput = '';
    this.lastConvertedInput = raw;
  }

  /** Clear all tracking state. */
  reset(): void {
    this.isComposing = false;
    this.lastConvertedInput = '';
    this.lastNewInput = '';
    this.previousRawInput = '';
  }

  /**
   * Track the current raw field value and decide whether an IME conversion committed.
   *
   * @param raw The current raw field value (must not be empty; the state machine handles empty input).
   * @param pendingKana The current 未確定かな owned by the state machine.
   * @returns The pending kana to adopt and whether the prior pending kana should be committed.
   */
  track(raw: string, pendingKana: string): TrackResult {
    const newInput = this.extractNewInput(raw);

    if (this.isComposing) {
      return this.handleCompositionInput(newInput, pendingKana);
    }
    return this.handleNormalInput(newInput, raw, pendingKana);
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
   * Keep the longest pending kana seen during composition: candidate browsing temporarily
   * shrinks the field, and the shrinking must not discard the existing 未確定かな.
   */
  private handleCompositionInput(newInput: string, pendingKana: string): TrackResult {
    const newPendingKana = extractKana(newInput);
    if (newPendingKana.length >= pendingKana.length) {
      return { pendingKana: newPendingKana, commit: false };
    }
    return { pendingKana, commit: false };
  }

  /**
   * Process normal (non-composing) input: detect deletions, update the tracking baseline,
   * and decide whether the user just confirmed an IME conversion.
   */
  private handleNormalInput(newInput: string, rawInput: string, pendingKana: string): TrackResult {
    const isDeletion = rawInput.length < this.previousRawInput.length;
    this.lastNewInput = newInput;
    this.previousRawInput = rawInput;

    const newPendingKana = extractKana(newInput);

    if (!isDeletion && this.detectAndCommitConversion(newPendingKana, pendingKana)) {
      this.lastConvertedInput = rawInput;
      return { pendingKana: '', commit: true };
    }

    return { pendingKana: newPendingKana, commit: false };
  }

  /**
   * Decide whether the user just confirmed an IME conversion and, if so, report the commit.
   *
   * Two heuristics signal a conversion:
   *
   * 1. **Large length jump** — the pending kana count changed by more than one in a single
   *    input event. A jump that big is not plain typing (which adds/removes one kana at a
   *    time); it means the IME replaced the reading with converted text. We skip the case
   *    where the new kana merely extends the old (`startsWith`), and re-check after kana
   *    compacting (小さなかな除去) so that small kana like っ/ゃ don't inflate the diff and
   *    cause a false positive.
   * 2. **Same length, different content with non-kana present** — the pending kana count is
   *    unchanged but the raw last input now contains non-kana characters (e.g. kanji). That
   *    means the reading was converted in place, so commit it.
   */
  private detectAndCommitConversion(newPendingKana: string, pendingKana: string): boolean {
    if (Math.abs(pendingKana.length - newPendingKana.length) > 1) {
      if (!newPendingKana.startsWith(pendingKana)) {
        const compacted = compactKana(newPendingKana);
        if (Math.abs(pendingKana.length - compacted.length) > 1) {
          return true;
        }
      }
    } else if (
      pendingKana.length === this.lastNewInput.length &&
      pendingKana !== this.lastNewInput
    ) {
      if (containsUnsupportedKana(this.lastNewInput)) {
        return true;
      }
    }
    return false;
  }
}
