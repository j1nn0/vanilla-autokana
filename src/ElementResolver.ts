/** A CSS selector string or a DOM Element. */
export type KanaElement = HTMLInputElement | HTMLTextAreaElement;
export type Bindable = string | KanaElement;

export function getElementLabel(selectorOrElement: Bindable): string {
  return typeof selectorOrElement === 'string' ? `"${selectorOrElement}"` : 'the provided element';
}

export function ensureElement(selectorOrElement: Bindable): HTMLElement | null {
  if (typeof selectorOrElement === 'string') {
    // CSS selectors (starting with #, ., [, or :) are passed directly to querySelector.
    // Bare strings are treated as IDs for backward compatibility.
    if (!/^[[.#:]/.test(selectorOrElement)) {
      return document.getElementById(selectorOrElement);
    }
    try {
      return document.querySelector(selectorOrElement);
    } catch {
      throw new Error(`AutoKana: Invalid selector for ${getElementLabel(selectorOrElement)}.`);
    }
  }
  if (selectorOrElement instanceof HTMLElement) {
    return selectorOrElement;
  }
  return null;
}

export function isKanaElement(el: HTMLElement): el is KanaElement {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

export function requireElement(selectorOrElement: Bindable): KanaElement {
  const el = ensureElement(selectorOrElement);
  if (!el) {
    const label = getElementLabel(selectorOrElement);
    throw new Error(
      `AutoKana: Element not found for ${label}. ` +
        `Ensure the DOM element exists before calling bind(). ` +
        `For Vue/React, call bind() inside onMounted()/useEffect() or after the component is mounted.`,
    );
  }
  if (!isKanaElement(el)) {
    const label = getElementLabel(selectorOrElement);
    throw new Error(`AutoKana: Element must be an input or textarea for ${label}.`);
  }
  return el;
}
