import { InputTracker } from './InputTracker';
import type { FuriganaResult, InputTransition } from './InputTracker';
import type { KanaElement, Bindable } from './ElementResolver';
import { requireElement, resolveOptionalKanaElement } from './ElementResolver';
import type { KatakanaOption } from './KanaConverter';

export type { Bindable };
export type { KatakanaOption };

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

/**
 * DOM event adapter for AutoKana. Owns the binding and unbinding of event listeners and the
 * mapping from DOM events to semantic transitions. The caller supplies a `dispatch` callback
 * that executes the transition and applies the resulting furigana.
 *
 * @internal Not part of the supported public API.
 */
class AutoKanaInputAdapter {
  private readonly handlers: Array<[string, EventListener]>;

  constructor(
    private readonly elName: KanaElement,
    private readonly dispatch: (transition: InputTransition) => void,
    private readonly debug: (message: unknown, detail?: unknown) => void,
  ) {
    this.handlers = [
      ['blur', this.blurHandler as EventListener],
      ['focus', this.focusHandler as EventListener],
      ['compositionstart', this.compositionStartHandler as EventListener],
      ['compositionend', this.compositionEndHandler as EventListener],
      ['input', this.inputHandler as EventListener],
    ];
  }

  /** Attach all DOM event listeners. */
  attach(): void {
    for (const [event, handler] of this.handlers) {
      this.elName.addEventListener(event, handler);
    }
  }

  /** Detach all DOM event listeners. Safe to call more than once. */
  detach(): void {
    for (const [event, handler] of this.handlers) {
      this.elName.removeEventListener(event, handler);
    }
  }

  private blurHandler = (): void => {
    this.debug('blur');
    this.dispatch({ type: 'blur' });
  };

  private focusHandler = (): void => {
    this.debug('focus');
    this.dispatch({ type: 'focus', raw: this.elName.value });
  };

  private compositionStartHandler = (): void => {
    this.debug('compositionstart');
    this.dispatch({ type: 'compositionstart' });
  };

  private compositionEndHandler = (): void => {
    this.debug('compositionend');
    this.dispatch({ type: 'compositionend', raw: this.elName.value });
  };

  private inputHandler = (event: InputEvent): void => {
    this.debug('input', event.isComposing);
    this.dispatch({ type: 'input', raw: this.elName.value });
  };
}

export default class AutoKana {
  private active = true;
  private destroyed = false;
  private readonly resolvedOption: StoredOption;
  private elFurigana?: KanaElement;
  private furigana: string;
  private readonly tracker: InputTracker;
  private adapter?: AutoKanaInputAdapter;

  /** Whether auto-kana tracking is active. Read-only; use {@link start} / {@link stop} / {@link toggle} to change it. */
  get isActive(): boolean {
    return this.active && !this.destroyed;
  }

  /** Current option values. Read-only; change the output format at runtime with {@link setKatakana}. */
  get option(): ResolvedOption {
    return { ...this.resolvedOption, katakana: this.tracker.getKatakana() };
  }

  constructor(name: Bindable, furigana: Bindable = '', option: AutoKanaOption = {}) {
    this.furigana = '';

    const { katakana = 'hiragana', ...rest } = option;
    this.resolvedOption = {
      ...rest,
      debug: option.debug ?? false,
    };

    this.tracker = new InputTracker(katakana);

    const elName = requireElement(name);
    const elFurigana = resolveOptionalKanaElement(furigana);

    if (elFurigana) {
      this.elFurigana = elFurigana;
    }

    this.adapter = new AutoKanaInputAdapter(
      elName,
      (transition) => this.handleTransition(transition),
      (message, detail) => this.debug(message, detail),
    );
    this.adapter.attach();
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
   * Toggle auto-kana tracking.
   */
  toggle(): void {
    if (this.destroyed) {
      return;
    }
    this.active = !this.active;
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

  private handleTransition(transition: InputTransition): void {
    if (!this.isActive) {
      return;
    }
    this.setFurigana(
      this.tracker.apply(
        transition.type === 'focus'
          ? { ...transition, committedSeed: this.elFurigana?.value }
          : transition,
      ),
    );
  }

  private setFurigana(result: FuriganaResult): void {
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
    this.adapter?.detach();
    this.adapter = undefined;
    this.elFurigana = undefined;
  }

  private debug(message: unknown, detail?: unknown): void {
    if (this.resolvedOption.debug) {
      // eslint-disable-next-line no-console
      console.log(message, ...(detail === undefined ? [] : [detail]));
    }
  }
}
