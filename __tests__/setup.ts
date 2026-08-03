import AutoKana, { type AutoKanaOption } from '../src/AutoKana';

const STANDARD_HTML = '<input name="name" id="name"><input name="furigana" id="furigana">';

type MountedAutoKana = {
  autokana: AutoKana;
  nameInput: HTMLInputElement;
  furiganaInput?: HTMLInputElement;
};

/** Name or furigana element accepted by the event helpers (AutoKana supports both). */
type TestInput = HTMLInputElement | HTMLTextAreaElement;

/** Replace the jsdom body with the standard name + furigana input pair (or a custom layout). */
export function setup(html = STANDARD_HTML): void {
  document.body.innerHTML = html;
}

/** Mount AutoKana against the standard name/furigana inputs and return the live elements. */
export function mountAutoKana(
  option: AutoKanaOption = {},
  html = STANDARD_HTML,
): MountedAutoKana {
  setup(html);
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const furiganaElement = document.getElementById('furigana');
  const furiganaInput = furiganaElement as HTMLInputElement | null;
  const autokana = new AutoKana('name', furiganaInput ? 'furigana' : '', option);
  return { autokana, nameInput, furiganaInput: furiganaInput ?? undefined };
}

/** Dispatch a normal input event after updating the name field. */
export function typeInput(
  nameInput: TestInput,
  value: string,
  init: InputEventInit = {},
): void {
  nameInput.value = value;
  nameInput.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      isComposing: false,
      inputType: 'insertText',
      ...init,
    }),
  );
}

/** Dispatch an IME composition-start event. */
export function startComposition(nameInput: TestInput): void {
  nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
}

/** Update a composing value and dispatch its composition input event. */
export function compositionInput(
  nameInput: TestInput,
  value: string,
  inputType = 'insertCompositionText',
): void {
  typeInput(nameInput, value, { isComposing: true, inputType });
}

/** Dispatch an IME composition-end event for the current value. */
export function endComposition(nameInput: TestInput, value: string, data = value): void {
  nameInput.value = value;
  nameInput.dispatchEvent(new CompositionEvent('compositionend', { data }));
}

/** Run one reading-to-converted IME transition. */
export function imeConvert(nameInput: TestInput, reading: string, converted: string): void {
  startComposition(nameInput);
  compositionInput(nameInput, reading, 'insertText');
  endComposition(nameInput, converted);
}
