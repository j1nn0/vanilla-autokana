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
<input name="name" id="name" />
<input name="furigana" id="furigana" />
<script src="autokana.umd.js" defer></script>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    // Output in hiragana (default)
    AutoKana.bind('#name', '#furigana');
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

### Options

You can pass the first two arguments as CSS selectors (e.g. `#id`, `.class`, `[name="foo"]`) or DOM Element instances. A bare ID string also works for backward compatibility.

- `katakana`: `false | 'full' | 'half'`
- `debug`: `boolean`
- `checkInterval`: `number` (default: `30`, in milliseconds)

`katakana` modes:

- `false`: Output in hiragana (default)
- `'full'`: Output in full-width katakana
- `'half'`: Output in half-width katakana (full-width spaces are normalized to half-width spaces)

`checkInterval` controls polling frequency for detecting conversion state changes.

```js
AutoKana.bind('#name', '#furigana', { checkInterval: 50 });
```

### Using with Vue.js

When using `v-model`, directly setting `value` on the furigana input is usually overwritten by Vue.
Use `getFurigana()` and copy it into a reactive property on input events.

```vue
<template>
  <input id="name" v-model="name" @input="handleNameInput" />
  <input id="furigana" v-model="furigana" />
</template>

<script>
import * as AutoKana from '@j1nn0/vanilla-autokana';

export default {
  data() {
    return { name: '', furigana: '', autokana: null };
  },
  mounted() {
    this.autokana = AutoKana.bind('#name', '#furigana');
  },
  beforeUnmount() {
    this.autokana.destroy();
  },
  methods: {
    handleNameInput() {
      this.furigana = this.autokana.getFurigana();
    },
  },
};
</script>
```

### Using with React.js

The same applies in React controlled components. Read the converted value with `getFurigana()` and sync it to state.

```jsx
import React, { useEffect, useRef, useState } from 'react';
import * as AutoKana from '@j1nn0/vanilla-autokana';

function App() {
  const [name, setName] = useState('');
  const [furigana, setFurigana] = useState('');
  const autokanaRef = useRef(null);

  useEffect(() => {
    autokanaRef.current = AutoKana.bind('#name', '#furigana');
    return () => autokanaRef.current.destroy();
  }, []);

  const handleNameInput = (ev) => {
    setName(ev.target.value);
    setFurigana(autokanaRef.current.getFurigana());
  };

  return (
    <>
      <input id="name" value={name} onInput={handleNameInput} />
      <input id="furigana" value={furigana} readOnly />
    </>
  );
}
```

## License

MIT

## Acknowledgments

This project is based on [ryo-utsunomiya/vanilla-autokana](https://github.com/ryo-utsunomiya/vanilla-autokana).

The design and implementation are strongly inspired by [jquery-autokana](https://github.com/harisenbon/autokana).
