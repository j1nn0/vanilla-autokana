import type { Meta, StoryObj } from '@storybook/html-vite';

import type { AutoKanaOption } from '../src/index';
import { bind } from '../src/index';

type Args = Pick<AutoKanaOption, 'katakana'>;

const FIELD_STYLE =
  'box-sizing:border-box;width:100%;padding:8px 12px;font-size:16px;border:1px solid #ccc;border-radius:4px;outline:none;';
const LABEL_STYLE = 'display:block;margin-bottom:4px;font-size:13px;color:#555;';
const FIELD_WRAP_STYLE = 'margin-bottom:12px;';

function buildForm(args: Args): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText =
    'max-width:360px;padding:24px;font-family:system-ui,sans-serif;background:#fafafa;border:1px solid #eee;border-radius:8px;';

  const nameWrap = document.createElement('div');
  nameWrap.style.cssText = FIELD_WRAP_STYLE;
  const nameLabel = document.createElement('label');
  nameLabel.textContent = '名前';
  nameLabel.style.cssText = LABEL_STYLE;
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = '名前を入力してください';
  nameInput.style.cssText = FIELD_STYLE;
  nameWrap.appendChild(nameLabel);
  nameWrap.appendChild(nameInput);

  const furiganaWrap = document.createElement('div');
  furiganaWrap.style.cssText = FIELD_WRAP_STYLE;
  const furiganaLabel = document.createElement('label');
  furiganaLabel.style.cssText = LABEL_STYLE;

  const modeLabel =
    args.katakana === 'full'
      ? 'カタカナ（全角）'
      : args.katakana === 'half'
        ? 'カタカナ（半角）'
        : 'ふりがな';
  furiganaLabel.textContent = `${modeLabel}（自動入力）`;

  const furiganaInput = document.createElement('input');
  furiganaInput.type = 'text';
  furiganaInput.placeholder = '自動入力されます';
  furiganaInput.style.cssText = FIELD_STYLE;
  furiganaWrap.appendChild(furiganaLabel);
  furiganaWrap.appendChild(furiganaInput);

  container.appendChild(nameWrap);
  container.appendChild(furiganaWrap);

  bind(nameInput, furiganaInput, { katakana: args.katakana });

  return container;
}

function buildFormWithCallback(_args: Args): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText =
    'max-width:360px;padding:24px;font-family:system-ui,sans-serif;background:#fafafa;border:1px solid #eee;border-radius:8px;';

  const nameWrap = document.createElement('div');
  nameWrap.style.cssText = FIELD_WRAP_STYLE;
  const nameLabel = document.createElement('label');
  nameLabel.textContent = '名前';
  nameLabel.style.cssText = LABEL_STYLE;
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = '名前を入力してください';
  nameInput.style.cssText = FIELD_STYLE;
  nameWrap.appendChild(nameLabel);
  nameWrap.appendChild(nameInput);

  const furiganaWrap = document.createElement('div');
  furiganaWrap.style.cssText = FIELD_WRAP_STYLE;
  const furiganaLabel = document.createElement('label');
  furiganaLabel.textContent = 'ふりがな（onChange コールバック）';
  furiganaLabel.style.cssText = LABEL_STYLE;
  const furiganaInput = document.createElement('input');
  furiganaInput.type = 'text';
  furiganaInput.placeholder = 'onChange で更新されます';
  furiganaInput.style.cssText = FIELD_STYLE;
  furiganaInput.readOnly = true;
  furiganaWrap.appendChild(furiganaLabel);
  furiganaWrap.appendChild(furiganaInput);

  container.appendChild(nameWrap);
  container.appendChild(furiganaWrap);

  bind(nameInput, furiganaInput, {
    onChange: (furigana) => {
      furiganaInput.value = furigana;
    },
  });

  return container;
}

const meta: Meta<Args> = {
  title: 'AutoKana',
  render: buildForm,
  argTypes: {
    katakana: {
      control: 'select',
      options: [false, 'full', 'half'],
      description: '出力文字種。false = ひらがな、full = 全角カタカナ、half = 半角カタカナ',
    },
  },
};

export default meta;

type Story = StoryObj<Args>;

export const Hiragana: Story = {
  name: 'ひらがな変換',
  args: { katakana: false },
};

export const KatakanaFull: Story = {
  name: 'カタカナ（全角）変換',
  args: { katakana: 'full' },
};

export const KatakanaHalf: Story = {
  name: 'カタカナ（半角）変換',
  args: { katakana: 'half' },
};

export const OnChangeCallback: Story = {
  name: 'onChange コールバック',
  render: buildFormWithCallback,
  args: { katakana: false },
};
