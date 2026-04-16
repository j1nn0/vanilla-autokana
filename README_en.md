# vanilla-autokana

A JavaScript library to complete Furigana automatically when typing in a form field.

This project is a fork of [ryo-utsunomiya/vanilla-autokana](https://github.com/ryo-utsunomiya/vanilla-autokana).

- Not dependent on jQuery
- Supports both script tag loading and ESModules import

This library is inspired by [jquery-autokana](https://github.com/harisenbon/autokana).

## Installation

> **Note:** This project requires [pnpm](https://pnpm.io/) ≥ 10 for development. End-users can install the package with any package manager.

### npm

```
npm i @j1nn0/vanilla-autokana # or yarn add @j1nn0/vanilla-autokana
```

### Without npm

Download `dist/autokana.umd.js` from this repository and load it with a script tag.

## Usage

```html
<input name="name" id="name">
<input name="furigana" id="furigana">
<script src="autokana.umd.js" defer></script>
<script>
  document.addEventListener("DOMContentLoaded", function() {
    // Output in hiragana (default)
    AutoKana.bind("#name", "#furigana");
    // Output in full-width katakana
    // AutoKana.bind("#name", "#furigana", { katakana: 'full' });
    // Output in half-width katakana
    // AutoKana.bind("#name", "#furigana", { katakana: 'half' });
  });
</script>
```

### Import as a module

```js
import * as AutoKana from '@j1nn0/vanilla-autokana';

AutoKana.bind('#name', '#furigana');
```

## License

MIT

## Acknowledgments

This project is based on [ryo-utsunomiya/vanilla-autokana](https://github.com/ryo-utsunomiya/vanilla-autokana).

The design and implementation are strongly inspired by [jquery-autokana](https://github.com/harisenbon/autokana).
