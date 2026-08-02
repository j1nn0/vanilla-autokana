import { InputTracker } from './InputTracker';
import type { FuriganaResult } from './InputTracker';
import type { KanaElement, Bindable } from './ElementResolver';
import { requireElement, resolveOptionalKanaElement } from './ElementResolver';
import type { KatakanaOption } from './KanaConverter';

export type { Bindable };
export type { KatakanaOption };

/** Minimal shape of a checkbox change event accepted by {@link AutoKana.toggle}. */
type ToggleEventLike = { target: { checked: boolean } };

export interface AutoKanaOption {
  /** Output format for furigana. `'hiragana'` = hiragana, `'full'` = full-width katakana, `'half'` = half-width katakana. */
  katakana?: KatakanaOption;
  /** When `true`, logs debug information to the console. */
  debug?: boolean;
  /** Callback invoked with the current furigana string whenever it changes. */
  onChange?: (furigana: string) => void;
}

type ResolvedOption = Readonly<AutoKanaOption & { katakana: KatakanaOption; debug: boolean }>;
type StoredOption = Readonly<Omit<AutoKanaOption, 'katakana'> & { debug: boolean }>;

export default class AutoKana {
  private active = true;
  private destroyed = false;
  private readonly resolvedOption: StoredOption;
  private elName?: KanaElement;
  private elFurigana?: KanaElement;
  private furigana: string;
  private readonly tracker: InputTracker;

  /** Whether auto-kana tracking is active. Read-only; use {@link start} / {@link stop} / {@link toggle} to change it. */
  get isActive(): boolean {
    return this.active && !this.destroyed;
  }

  /** Current option values. Read-only; change the output format at runtime with {@link setKatakana}. */
  get option(): ResolvedOption {
    return { ...this.resolvedOption, katakana: this.tracker.getKatakana() };
  }

  private blurHandler = (): void => {
    this.debug('blur');
    this.runActiveTransition(() => this.tracker.blur());
  };

  private focusHandler = (): void => {
    this.debug('focus');
    const elName = this.elName;
    if (!elName) {
      return;
    }
    this.runActiveTransition(() => this.tracker.resync(elName.value, this.elFurigana?.value));
  };

  private compositionStartHandler = (): void => {
    this.debug('compositionstart');
    this.runActiveTransition(() => this.tracker.startComposition());
  };

  private compositionEndHandler = (): void => {
    this.debug('compositionend');
    const elName = this.elName;
    if (!elName) {
      return;
    }
    this.runActiveTransition(() => this.tracker.endComposition(elName.value));
  };

  private inputHandler = (event: InputEvent): void => {
    this.debug('input', event.isComposing);
    const elName = this.elName;
    if (!elName) {
      return;
    }
    this.runActiveTransition(() => this.tracker.trackInput(elName.value));
  };

  private readonly eventPairs: Array<[string, EventListener]> = [
    ['blur', this.blurHandler],
    ['focus', this.focusHandler],
    ['compositionstart', this.compositionStartHandler],
    ['compositionend', this.compositionEndHandler],
    ['input', this.inputHandler as EventListener],
  ];

  constructor(name: Bindable, furigana: Bindable = '', option: Partial<AutoKanaOption> = {}) {
    this.furigana = '';

    const { katakana = 'hiragana', ...rest } = option;
    this.resolvedOption = {
      ...rest,
      debug: option.debug ?? false,
    };

    this.tracker = new InputTracker(katakana);

    const elName = requireElement(name);
    const elFurigana = resolveOptionalKanaElement(furigana);

    this.elName = elName;
    if (elFurigana) {
      this.elFurigana = elFurigana;
    }
    this.registerEvents(elName);
  }

  /**
   * Get the current furigana string.
   *
   * @returns The current furigana string.
   */
  getFurigana(): string {
    return this.furigana;
  }

  /**
   * Resume auto-kana tracking.
   */
  start(): void {
    if (this.destroyed) {
      return;
    }
    this.active = true;
  }

  /**
   * Pause auto-kana tracking.
   */
  stop(): void {
    if (this.destroyed) {
      return;
    }
    this.active = false;
  }

  /**
   * Toggle auto-kana tracking on or off.
   *
   * @param event Optional checkbox change event. When provided, uses the checked state of the target.
   */
  toggle(event?: ToggleEventLike): void {
    if (this.destroyed) {
      return;
    }
    if (event) {
      this.active = event.target.checked;
    } else {
      this.active = !this.active;
    }
  }

  /**
   * Change the furigana output format at runtime. Re-renders the current furigana immediately.
   *
   * @param katakana The new output format: `'hiragana'` | `'full'` | `'half'`.
   */
  setKatakana(katakana: KatakanaOption): void {
    if (this.destroyed) {
      return;
    }
    this.setFurigana(this.tracker.setKatakana(katakana));
  }

  /**
   * Reset all tracking state and clear the furigana output (DOM element and onChange).
   */
  reset(): void {
    if (this.destroyed) {
      return;
    }
    this.setFurigana(this.tracker.reset());
  }

  private runActiveTransition(transition: () => FuriganaResult): void {
    if (!this.isActive) {
      return;
    }
    this.setFurigana(transition());
  }

  private registerEvents(elName: KanaElement): void {
    for (const [event, handler] of this.eventPairs) {
      elName.addEventListener(event, handler);
    }
  }

  private setFurigana(result: FuriganaResult): void {
    if (this.destroyed) {
      return;
    }
    if (!result.notify && result.furigana === this.furigana) {
      return;
    }
    this.furigana = result.furigana;
    if (this.elFurigana) {
      this.elFurigana.value = this.furigana;
      this.elFurigana.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (this.resolvedOption.onChange) {
      this.resolvedOption.onChange(this.furigana);
    }
  }

  /**
   * Remove all event listeners from the name element. Safe to call more than once.
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.active = false;
    if (this.elName) {
      for (const [event, handler] of this.eventPairs) {
        this.elName.removeEventListener(event, handler);
      }
    }
    this.elName = undefined;
    this.elFurigana = undefined;
  }

  private debug(message: unknown, detail?: unknown): void {
    if (!this.resolvedOption.debug) {
      return;
    }
    if (detail === undefined) {
      // eslint-disable-next-line no-console
      console.log(message);
      return;
    }
    // eslint-disable-next-line no-console
    console.log(message, detail);
  }
}
