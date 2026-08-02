import type { Meta, StoryObj } from '@storybook/html-vite';

import type { AutoKanaOption } from '../src/index';
import { bind } from '../src/index';
import {
  CONTAINER_STYLE,
  FIELD_STYLE,
  FIELD_WRAP_STYLE,
  getModeLabel,
  KATAKANA_ARG_TYPES,
  LABEL_STYLE,
  registerStoryTeardown,
} from './helpers';

type Args = Pick<AutoKanaOption, 'katakana'>;

type OutputMode = 'element' | 'callback';

function buildForm(args: Args, outputMode: OutputMode = 'element'): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = CONTAINER_STYLE;

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

  const modeLabel = getModeLabel(args.katakana);
  const usesCallback = outputMode === 'callback';
  furiganaLabel.textContent = usesCallback
    ? `${modeLabel}（onChange コールバック）`
    : `${modeLabel}（自動入力）`;

  const furiganaInput = document.createElement('input');
  furiganaInput.type = 'text';
  furiganaInput.placeholder = usesCallback ? 'onChange で更新されます' : '自動入力されます';
  furiganaInput.style.cssText = FIELD_STYLE;
  furiganaInput.readOnly = usesCallback;
  furiganaWrap.appendChild(furiganaLabel);
  furiganaWrap.appendChild(furiganaInput);

  container.appendChild(nameWrap);
  container.appendChild(furiganaWrap);

  const autokana = bind(nameInput, usesCallback ? undefined : furiganaInput, {
    katakana: args.katakana,
    onChange: usesCallback
      ? (furigana) => {
          furiganaInput.value = furigana;
        }
      : undefined,
  });
  registerStoryTeardown(() => autokana.destroy());

  return container;
}

const meta: Meta<Args> = {
  title: 'AutoKana',
  render: (args) => buildForm(args),
  argTypes: KATAKANA_ARG_TYPES,
};

export default meta;

type Story = StoryObj<Args>;

export const Hiragana: Story = {
  name: 'ひらがな変換',
  args: { katakana: 'hiragana' },
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
  render: (args) => buildForm(args, 'callback'),
  args: { katakana: 'hiragana' },
};
