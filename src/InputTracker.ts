import { ConversionDetector } from './ConversionDetector';
import { canonicalizeKana, toKatakana } from './KanaConverter';
import type { KatakanaOption } from './KanaConverter';

/** Result of a single state transition: the current ふりがな and whether output notification is forced. */
export interface FuriganaResult {
  furigana: string;
  notify: boolean;
}

/**
 * IME kana state machine: separates 確定かな (committed) from 未確定かな (pending), owns the
 * output format, and maps lifecycle transitions to the current furigana. The input tracking
 * and conversion detection heuristics live in the internal `ConversionDetector`; this class
 * applies the returned decisions (commit moves pending kana into committed kana).
 * AutoKana's DOM adapter owns the elements and events, while the adapter owns output policy.
 *
 * @internal Not part of the supported public API; not exported from the package entry.
 */
export class InputTracker {
  private committedKana = '';
  private pendingKana = '';
  private readonly detector = new ConversionDetector();

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
    this.detector.startComposition();
    return { furigana: this.formatFurigana(), notify: false };
  }

  /** Track the current raw field value and return the resulting furigana. */
  trackInput(raw: string): FuriganaResult {
    if (raw === '') {
      return this.clearState(false);
    }

    const result = this.detector.track(raw, this.pendingKana);
    if (result.commit) {
      this.committedKana += this.pendingKana;
    }
    this.pendingKana = result.pendingKana;

    return { furigana: this.formatFurigana(), notify: false };
  }

  /**
   * End an IME composition and process the current raw value in one transition.
   */
  endComposition(raw: string): FuriganaResult {
    this.detector.endComposition();
    return this.trackInput(raw);
  }

  /** End composition mode without changing the current kana. */
  blur(): FuriganaResult {
    this.detector.blur();
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

    this.detector.resync(raw);
    if (committedSeed !== undefined) {
      this.committedKana = canonicalizeKana(committedSeed);
    }
    this.pendingKana = '';
    return { furigana: this.formatFurigana(), notify: false };
  }

  /** Clear all tracking state and force output notification for an explicit reset command. */
  reset(): FuriganaResult {
    return this.clearState(true);
  }

  private clearState(notify: boolean): FuriganaResult {
    this.detector.reset();
    this.committedKana = '';
    this.pendingKana = '';
    return { furigana: this.formatFurigana(), notify };
  }

  private formatFurigana(): string {
    return toKatakana(this.committedKana + this.pendingKana, this.katakana);
  }
}
