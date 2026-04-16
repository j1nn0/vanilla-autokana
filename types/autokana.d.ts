declare module '@j1nn0/vanilla-autokana' {
  type Bindable = string | Element;
  export interface AutoKanaOption {
    katakana: false | 'full' | 'half';
    debug: boolean;
    checkInterval: number;
  }
  export function bind(
    name: Bindable,
    furigana?: Bindable,
    option?: Partial<AutoKanaOption>,
  ): AutoKana;
  class AutoKana {
    constructor(name: Bindable, furigana?: Bindable, option?: Partial<AutoKanaOption>);
    public getFurigana(): string;
    public start(): void;
    public stop(): void;
    public toggle(event?: Event): void;
    public destroy(): void;
  }
}
