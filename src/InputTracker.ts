import { ConversionDetector } from './ConversionDetector';
import { extractKana } from './KanaExtractor';
import { toKatakana } from './KanaConverter';
import type { KatakanaOption } from './KanaConverter';

/** Result of a single state transition: the current ふりがな and whether output notification is forced. */
export interface FuriganaResult {
  furigana: string;
  notify: boolean;
}

/** DOM-driven transition accepted by the IME kana state machine. */
export type InputTransition =
  | { type: 'blur' }
  | { type: 'focus'; raw: string; committedSeed?: string }
  | { type: 'compositionstart' }
  | { type: 'compositionend'; raw: string }
  | { type: 'input'; raw: string };

/**
 * IME kana state machine: separates 確定かな (committed) from 未確定かな (pending), owns the
 * output format, and applies each input transition to the current furigana. The input tracking
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

  /** Apply one DOM-driven input transition. */
  apply(transition: InputTransition): FuriganaResult {
    switch (transition.type) {
      case 'blur':
        this.detector.blur();
        return this.result();
      case 'focus':
        return this.resync(transition.raw, transition.committedSeed);
      case 'compositionstart':
        this.detector.startComposition();
        return this.result();
      case 'compositionend':
        this.detector.endComposition();
        return this.trackInput(transition.raw);
      case 'input':
        return this.trackInput(transition.raw);
    }
  }

  /** Clear all tracking state and force output notification for an explicit reset command. */
  reset(): FuriganaResult {
    return this.clearState(true);
  }

  private trackInput(raw: string): FuriganaResult {
    if (raw === '') {
      return this.clearState(false);
    }

    const result = this.detector.track(raw, this.pendingKana);
    if (result.commit) {
      this.committedKana += this.pendingKana;
    }
    this.pendingKana = result.pendingKana;

    return this.result();
  }

  private resync(raw: string, committedSeed: string | undefined): FuriganaResult {
    if (raw === '') {
      return this.clearState(false);
    }

    this.detector.resync(raw);
    if (committedSeed !== undefined) {
      this.committedKana = extractKana(committedSeed);
    }
    this.pendingKana = '';
    return this.result();
  }

  private clearState(notify: boolean): FuriganaResult {
    this.detector.reset();
    this.committedKana = '';
    this.pendingKana = '';
    return { furigana: this.formatFurigana(), notify };
  }

  private result(): FuriganaResult {
    return { furigana: this.formatFurigana(), notify: false };
  }

  private formatFurigana(): string {
    return toKatakana(this.committedKana + this.pendingKana, this.katakana);
  }
}
