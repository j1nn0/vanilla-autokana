import AutoKana from './AutoKana';
import type { AutoKanaOption } from './AutoKana';

/**
 * Bind elements to AutoKana.
 *
 * @param name ID or element of the name input.
 * @param furigana ID or element of the furigana input.
 * @param option Option.
 * @returns An AutoKana instance.
 */
export function bind(
  name: string | Element,
  furigana?: string | Element,
  option: Partial<AutoKanaOption> = {},
): AutoKana {
  return new AutoKana(name, furigana, option);
}

export { AutoKana };
export type { AutoKanaOption };
