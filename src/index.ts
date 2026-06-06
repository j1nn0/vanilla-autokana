import AutoKana from './AutoKana';
import type { AutoKanaOption, Bindable, KatakanaOption } from './AutoKana';
import { KanaConverter } from './KanaConverter';
import { KanaExtractor } from './KanaExtractor';

/**
 * Bind elements to AutoKana.
 *
 * @param name Selector string starting with `#`, `.`, `[`, or `:`, or an element of the name input. Bare ID strings are also supported.
 * @param furigana Selector string starting with `#`, `.`, `[`, or `:`, or an element of the furigana output input. Optional. Bare ID strings are also supported.
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

export { AutoKana, KanaConverter, KanaExtractor };
export type { AutoKanaOption, Bindable, KatakanaOption };
