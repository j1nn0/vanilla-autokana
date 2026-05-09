import type { Meta, StoryObj } from '@storybook/html-vite';
import { createApp, h, ref, onMounted, onUnmounted, defineComponent } from 'vue';
import { bind, type AutoKanaOption } from '../src/index';

type Args = Pick<AutoKanaOption, 'katakana'>;

const FIELD_STYLE =
  'box-sizing:border-box;width:100%;padding:8px 12px;font-size:16px;border:1px solid #ccc;border-radius:4px;outline:none;';
const LABEL_STYLE = 'display:block;margin-bottom:4px;font-size:13px;color:#555;';
const FIELD_WRAP_STYLE = 'margin-bottom:12px;';

function getModeLabel(katakana: AutoKanaOption['katakana']): string {
  if (katakana === 'full') return 'カタカナ（全角）';
  if (katakana === 'half') return 'カタカナ（半角）';
  return 'ふりがな';
}

const DemoWrapper = defineComponent({
  props: {
    katakana: { default: false },
  },
  setup(props) {
    const furigana = ref('');
    const nameRef = ref<HTMLInputElement | null>(null);
    let autokana: ReturnType<typeof bind> | null = null;

    onMounted(() => {
      if (nameRef.value) {
        autokana = bind(nameRef.value, undefined, {
          katakana: props.katakana as AutoKanaOption['katakana'],
          onChange: (furi) => {
            furigana.value = furi;
          },
        });
      }
    });

    onUnmounted(() => {
      autokana?.destroy();
    });

    return { furigana, nameRef, modeLabel: getModeLabel(props.katakana as AutoKanaOption['katakana']) };
  },
  render() {
    return h('div', {
      style: 'max-width:360px;padding:24px;font-family:system-ui,sans-serif;background:#fafafa;border:1px solid #eee;border-radius:8px;',
    }, [
      h('div', { style: FIELD_WRAP_STYLE }, [
        h('label', { style: LABEL_STYLE }, '名前'),
        h('input', {
          ref: 'nameRef',
          type: 'text',
          placeholder: '名前を入力してください',
          style: FIELD_STYLE,
        }),
      ]),
      h('div', { style: FIELD_WRAP_STYLE }, [
        h('label', { style: LABEL_STYLE }, `${this.modeLabel}（onChange コールバック）`),
        h('input', {
          type: 'text',
          value: this.furigana,
          readOnly: true,
          placeholder: 'onChange で更新されます',
          style: `${FIELD_STYLE};background:#f5f5f5;`,
        }),
      ]),
    ]);
  },
});

let app: ReturnType<typeof createApp> | null = null;

function renderVueDemo(args: Args): HTMLElement {
  const container = document.createElement('div');
  app = createApp(DemoWrapper, { katakana: args.katakana });
  app.mount(container);
  return container;
}

const meta: Meta<Args> = {
  title: 'AutoKana/Vue',
  render: renderVueDemo,
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

export const VueHiragana: Story = {
  name: 'Vue + ひらがな',
  args: { katakana: false },
};

export const VueKatakanaFull: Story = {
  name: 'Vue + カタカナ（全角）',
  args: { katakana: 'full' },
};

export const VueKatakanaHalf: Story = {
  name: 'Vue + カタカナ（半角）',
  args: { katakana: 'half' },
};