import AutoKana from './AutoKana';
import type { AutoKanaOption, Bindable } from './AutoKana';

/**
 * Bind elements to AutoKana.
 *
 * @param name CSS selector or element of the name input.
 * @param furigana CSS selector or element of the furigana input.
 * @param option Option.
 * @returns An AutoKana instance.
 */
export function bind(
  name: Bindable,
  furigana?: Bindable,
  option: Partial<AutoKanaOption> = {},
): AutoKana {
  return new AutoKana(name, furigana, option);
}

export { AutoKana };
export type { AutoKanaOption, Bindable };
