import type { Meta, StoryObj } from '@storybook/html-vite';
import { createApp, h, ref, onMounted, onUnmounted, defineComponent } from 'vue';
import { bind, type AutoKanaOption } from '../src/index';
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

const DemoWrapper = defineComponent({
  props: {
    katakana: { default: 'hiragana' as AutoKanaOption['katakana'] },
  },
  setup(props) {
    const furigana = ref('');
    const nameRef = ref<HTMLInputElement | null>(null);
    let autokana: ReturnType<typeof bind> | null = null;

    onMounted(() => {
      if (nameRef.value) {
        autokana = bind(nameRef.value, undefined, {
          katakana: props.katakana,
          onChange: (furi) => {
            furigana.value = furi;
          },
        });
      }
    });

    onUnmounted(() => {
      autokana?.destroy();
    });

    return { furigana, nameRef, modeLabel: getModeLabel(props.katakana) };
  },
  render() {
    return h('div', {
      style: CONTAINER_STYLE,
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
  const mountedApp = createApp(DemoWrapper, { katakana: args.katakana });
  app = mountedApp;
  mountedApp.mount(container);
  registerStoryTeardown(() => {
    mountedApp.unmount();
    if (app === mountedApp) {
      app = null;
    }
  });
  return container;
}

const meta: Meta<Args> = {
  title: 'AutoKana/Vue',
  render: renderVueDemo,
  argTypes: KATAKANA_ARG_TYPES,
};

export default meta;

type Story = StoryObj<Args>;

export const VueHiragana: Story = {
  name: 'Vue + ひらがな',
  args: { katakana: 'hiragana' },
};

export const VueKatakanaFull: Story = {
  name: 'Vue + カタカナ（全角）',
  args: { katakana: 'full' },
};

export const VueKatakanaHalf: Story = {
  name: 'Vue + カタカナ（半角）',
  args: { katakana: 'half' },
};
