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

- Pass the source input element (where the user types) as the first argument to `AutoKana.bind()`. The second argument can specify the destination input element (where furigana appears), but it is optional.
- Elements can be specified via selector strings starting with `#`, `.`, `[`, or `:`, or input / textarea elements. Passing a bare ID string also works for backward compatibility.
- Run inside a `DOMContentLoaded` event to ensure input / textarea elements are available.
- The library itself does not depend on DOM lifecycle events, so adding the `defer` attribute to the script tag is recommended.

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

You can pass the following as the third argument to `AutoKana.bind(name, furigana?, option)`:

- `name`: a selector string starting with `#`, `.`, `[`, or `:`, or an input / textarea element
- `furigana`: a selector string starting with `#`, `.`, `[`, or `:`, an input / textarea element, or omitted

- `katakana`: `'hiragana' | 'full' | 'half'`
- `debug`: `boolean`
- `onChange`: `(furigana: string) => void` — Callback invoked whenever the furigana changes

`katakana` modes:

- `'hiragana'`: Output in hiragana (default)
- `'full'`: Output in full-width katakana
- `'half'`: Output in half-width katakana (full-width spaces are normalized to half-width spaces)

## Migration Guide (v1 → v2)

### Breaking Change

The `katakana` option type has changed in v2.0.0.

| Before (v1) | After (v2) |
|-------------|------------|
| `katakana: false` | `katakana: 'hiragana'` |
| `katakana: 'full'` | `katakana: 'full'` (no change) |
| `katakana: 'half'` | `katakana: 'half'` (no change) |

### Migration

```js
// v1
AutoKana.bind('#name', '#furigana', { katakana: false });

// v2
AutoKana.bind('#name', '#furigana', { katakana: 'hiragana' });
```

### Methods

- `getFurigana()`: Returns the current furigana string
- `start()`: Resume auto-kana tracking
- `stop()`: Pause auto-kana tracking
- `toggle(event?)`: Toggle auto-kana tracking on or off. When a checkbox change event is provided, uses its `checked` state
- `reset()`: Reset all internal state (furigana, conversion flags, etc.)
- `destroy()`: Remove all event listeners

> **Note**: `initializeValues()` is deprecated. Use `reset()` instead.

### Using with Vue.js

Use the `onChange` callback to detect furigana changes without polling `getFurigana()`.
When a furigana output input is provided, an `input` event with `bubbles: true` is also dispatched on that element.

```vue
<template>
  <div id="app">
    <div>
      <label for="name">Name</label>
      <input name="name" id="name" v-model="name">
    </div>
    <div>
      <label for="furigana">Furigana</label>
      <input name="furigana" id="furigana" v-model="furigana">
    </div>
    <h2>Confirm your input</h2>
    <p>Name: {{ name }}</p>
    <p>Furigana: {{ furigana }}</p>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import { bind } from '@j1nn0/vanilla-autokana';

  const name = ref('');
  const furigana = ref('');
  let autokana;

  onMounted(() => {
    autokana = bind('#name', '#furigana', {
      onChange: (value) => {
        furigana.value = value;
      },
    });
  });

  onUnmounted(() => {
    autokana?.destroy();
  });
</script>
```

Even when using `v-model`, an `input` event is dispatched on the furigana output input. Still, `onChange` is the recommended way to keep framework state in sync.
You can also use the `getFurigana` method to retrieve the furigana, but `onChange` is recommended.

```html
<!-- Not recommended: polling getFurigana() -->
<input name="name" id="name" v-model="name" @input="handleNameInput">
```

### Using with React.js

The same `onChange` callback approach works with React.

```jsx
import { useEffect, useState } from 'react';
import { bind } from '@j1nn0/vanilla-autokana';

function App() {
  const [name, setName] = useState('');
  const [furigana, setFurigana] = useState('');

  useEffect(() => {
    const autokana = bind('#name', '#furigana', {
      onChange: (value) => {
        setFurigana(value);
      },
    });

    return () => {
      autokana.destroy();
    };
  }, []);

  return (
    <div className="App">
      <div>
        <label htmlFor="name">Name</label>
        <input
          name="name"
          id="name"
          value={name}
          onInput={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="furigana">Furigana</label>
        <input name="furigana" id="furigana" value={furigana} readOnly />
      </div>
      <h2>Confirm your input</h2>
      <p>Name: {name}</p>
      <p>Furigana: {furigana}</p>
    </div>
  );
}

export default App;
```

## License

MIT

## Acknowledgments

This project is based on [ryo-utsunomiya/vanilla-autokana](https://github.com/ryo-utsunomiya/vanilla-autokana).

The design and implementation are strongly inspired by [jquery-autokana](https://github.com/harisenbon/autokana).
