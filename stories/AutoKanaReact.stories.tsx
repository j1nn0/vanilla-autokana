import type { Meta, StoryObj } from '@storybook/html-vite';
import { createElement, useState, useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { bind, type AutoKanaOption } from '../src/index';
import { getModeLabel } from './helpers';

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
    style: { maxWidth: '360px', padding: '24px', fontFamily: 'system-ui, sans-serif', background: '#fafafa', border: '1px solid #eee', borderRadius: '8px' },
    children: [
      createElement('div', { key: 'name', style: { marginBottom: '12px' } },
        createElement('label', { style: { display: 'block', marginBottom: '4px', fontSize: '13px', color: '#555' } }, '名前'),
        createElement('input', {
          ref: nameRef,
          type: 'text',
          placeholder: '名前を入力してください',
          style: { boxSizing: 'border-box', width: '100%', padding: '8px 12px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' },
        }),
      ),
      createElement('div', { key: 'furi', style: { marginBottom: '12px' } },
        createElement('label', { style: { display: 'block', marginBottom: '4px', fontSize: '13px', color: '#555' } }, `${modeLabel}（onChange コールバック）`),
        createElement('input', {
          type: 'text',
          value: furigana,
          readOnly: true,
          placeholder: 'onChange で更新されます',
          style: { boxSizing: 'border-box', width: '100%', padding: '8px 12px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none', background: '#f5f5f5' },
        }),
      ),
    ],
  });
}

let root: Root | null = null;

function renderReactDemo(args: Args): HTMLElement {
  const container = document.createElement('div');
  root = createRoot(container);
  root.render(createElement(ReactDemo, args));
  return container;
}

const meta: Meta<Args> = {
  title: 'AutoKana/React',
  render: renderReactDemo,
  argTypes: {
    katakana: {
      control: 'select',
      options: ['hiragana', 'full', 'half'],
      description: '出力文字種。hiragana = ひらがな、full = 全角カタカナ、half = 半角カタカナ',
    },
  },
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
