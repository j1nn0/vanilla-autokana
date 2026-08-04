import AutoKana, { type AutoKanaOption } from '../src/AutoKana';

const STANDARD_HTML = '<input name="name" id="name"><input name="furigana" id="furigana">';

type MountedAutoKana = {
  autokana: AutoKana;
  nameInput: HTMLInputElement;
  furiganaInput: HTMLInputElement;
};

type MountedNameOnly = {
  autokana: AutoKana;
  nameInput: HTMLInputElement;
};

/** Name or furigana element accepted by the event helpers (AutoKana supports both). */
type TestInput = HTMLInputElement | HTMLTextAreaElement;

/** Replace the jsdom body with the standard name + furigana input pair (or a custom layout). */
export function setup(html = STANDARD_HTML): void {
  document.body.innerHTML = html;
}

/** Mount AutoKana against the standard name/furigana inputs and return the live elements. */
export function mountAutoKana(option: AutoKanaOption = {}): MountedAutoKana {
  setup();
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
  const autokana = new AutoKana('name', 'furigana', option);
  return { autokana, nameInput, furiganaInput };
}

/** Mount AutoKana against the standard name input without an output element. */
export function mountNameOnly(option: AutoKanaOption = {}): MountedNameOnly {
  setup('<input name="name" id="name">');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const autokana = new AutoKana('name', undefined, option);
  return { autokana, nameInput };
}

/** Re-seed the live DOM and dispatch focus so AutoKana performs 再同期. */
export function focusName(
  nameInput: TestInput,
  raw: string,
  furiganaInput?: TestInput,
  seed?: string,
): void {
  if (furiganaInput && seed !== undefined) {
    furiganaInput.value = seed;
  }
  nameInput.value = raw;
  nameInput.dispatchEvent(new Event('focus'));
}

/** Dispatch blur so AutoKana leaves IME composition tracking. */
export function blurName(nameInput: TestInput): void {
  nameInput.dispatchEvent(new Event('blur'));
}

function dispatchInput(nameInput: TestInput, value: string, isComposing: boolean): void {
  nameInput.value = value;
  nameInput.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      isComposing,
    }),
  );
}

/** Dispatch a normal input event after updating the name field. */
export function typeInput(nameInput: TestInput, value: string): void {
  dispatchInput(nameInput, value, false);
}

/** Dispatch an IME composition-start event. */
export function startComposition(nameInput: TestInput): void {
  nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
}

/** Update a composing value and dispatch its composition input event. */
export function compositionInput(nameInput: TestInput, value: string): void {
  dispatchInput(nameInput, value, true);
}

/** Dispatch an IME composition-end event for the current value. */
export function endComposition(nameInput: TestInput, value: string, data = value): void {
  nameInput.value = value;
  nameInput.dispatchEvent(new CompositionEvent('compositionend', { data }));
}

/** Run one reading-to-converted IME transition. */
export function imeConvert(nameInput: TestInput, reading: string, converted: string): void {
  startComposition(nameInput);
  compositionInput(nameInput, reading);
  endComposition(nameInput, converted);
}
