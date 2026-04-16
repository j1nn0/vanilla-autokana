# vanilla-autokana

A JavaScript library to complete Furigana automatically when typing in a form field.

- Not dependent on jQuery
- Supports both script tag loading and ESModules import

This library is inspired by [jquery-autokana](https://github.com/harisenbon/autokana).

## Installation

### npm

```
npm i vanilla-autokana # or yarn add vanilla-autokana
```

### Without npm

Download `dist/autokana.js` from this repository and load it with a script tag.

## Usage

```html
<input name="name" id="name">
<input name="furigana" id="furigana">
<script src="autokana.js" defer></script>
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
import * as AutoKana from 'vanilla-autokana';

AutoKana.bind('#name', '#furigana');
```

## License

MIT
