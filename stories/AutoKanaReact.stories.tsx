import type { Meta, StoryObj } from '@storybook/html-vite';
import { createElement, useState, useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { bind, type AutoKanaOption } from '../src/index';
import {
  CONTAINER_STYLE_OBJECT,
  FIELD_STYLE_OBJECT,
  FIELD_WRAP_STYLE_OBJECT,
  getModeLabel,
  KATAKANA_ARG_TYPES,
  LABEL_STYLE_OBJECT,
  registerStoryTeardown,
} from './helpers';

type Args = Pick<AutoKanaOption, 'katakana'>;

function ReactDemo({ katakana }: Args): React.ReactElement {
  const [furigana, setFurigana] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const autokanaRef = useRef<ReturnType<typeof bind> | null>(null);

  useEffect(() => {
    if (nameRef.current) {
      autokanaRef.current = bind(nameRef.current, undefined, {
        katakana,
        onChange: (furi) => setFurigana(furi),
      });
    }
    return () => {
      autokanaRef.current?.destroy();
    };
  }, [katakana]);

  const modeLabel = getModeLabel(katakana);

  return createElement('div', {
    style: CONTAINER_STYLE_OBJECT,
    children: [
      createElement(
        'div',
        { key: 'name', style: FIELD_WRAP_STYLE_OBJECT },
        createElement('label', { style: LABEL_STYLE_OBJECT }, '名前'),
        createElement('input', {
          ref: nameRef,
          type: 'text',
          placeholder: '名前を入力してください',
          style: FIELD_STYLE_OBJECT,
        }),
      ),
      createElement(
        'div',
        { key: 'furi', style: FIELD_WRAP_STYLE_OBJECT },
        createElement(
          'label',
          { style: LABEL_STYLE_OBJECT },
          `${modeLabel}（onChange コールバック）`,
        ),
        createElement('input', {
          type: 'text',
          value: furigana,
          readOnly: true,
          placeholder: 'onChange で更新されます',
          style: { ...FIELD_STYLE_OBJECT, background: '#f5f5f5' },
        }),
      ),
    ],
  });
}

let root: Root | null = null;

function renderReactDemo(args: Args): HTMLElement {
  const container = document.createElement('div');
  const mountedRoot = createRoot(container);
  root = mountedRoot;
  mountedRoot.render(createElement(ReactDemo, args));
  registerStoryTeardown(() => {
    mountedRoot.unmount();
    if (root === mountedRoot) {
      root = null;
    }
  });
  return container;
}

const meta: Meta<Args> = {
  title: 'AutoKana/React',
  render: renderReactDemo,
  argTypes: KATAKANA_ARG_TYPES,
};

export default meta;

type Story = StoryObj<Args>;

export const ReactHiragana: Story = {
  name: 'React + ひらがな',
  args: { katakana: 'hiragana' },
};

export const ReactKatakanaFull: Story = {
  name: 'React + カタカナ（全角）',
  args: { katakana: 'full' },
};

export const ReactKatakanaHalf: Story = {
  name: 'React + カタカナ（半角）',
  args: { katakana: 'half' },
};
