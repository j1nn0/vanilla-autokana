import { describe, expect, test, vi, afterEach } from 'vitest';
import { act } from 'react';
import { nextTick } from 'vue';
import htmlStoryMeta from '../stories/AutoKana.stories';
import reactStoryMeta from '../stories/AutoKanaReact.stories';
import vueStoryMeta from '../stories/AutoKanaVue.stories';
import { cleanupStoryTeardowns, registerStoryTeardown } from '../stories/helpers';
import { typeInput } from './setup';

afterEach(cleanupStoryTeardowns);

describe('Storybook teardown', () => {
  test('runs each teardown once and clears the registry', () => {
    const teardown = () => undefined;
    const registeredTeardown = vi.fn(teardown);
    registerStoryTeardown(registeredTeardown);

    cleanupStoryTeardowns();
    cleanupStoryTeardowns();

    expect(registeredTeardown).toHaveBeenCalledOnce();
  });

  test('HTML story teardown destroys its bound AutoKana instance', () => {
    const render = htmlStoryMeta.render as (args: { katakana: 'hiragana' }) => HTMLElement;
    const container = render({ katakana: 'hiragana' });
    const nameInput = container.querySelector('input') as HTMLInputElement;
    const furiganaInput = container.querySelectorAll('input')[1] as HTMLInputElement;

    typeInput(nameInput, 'やまだ');
    expect(furiganaInput.value).toBe('やまだ');

    cleanupStoryTeardowns();

    // After destroy(), typing into the still-attached input must not update the output.
    typeInput(nameInput, 'たろう');
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('React story teardown unmounts its bound AutoKana instance', async () => {
    const render = reactStoryMeta.render as (args: { katakana: 'hiragana' }) => HTMLElement;
    let container!: HTMLElement;

    await act(async () => {
      container = render({ katakana: 'hiragana' });
    });

    const nameInput = container.querySelector('input') as HTMLInputElement;
    const furiganaInput = container.querySelectorAll('input')[1] as HTMLInputElement;

    await act(async () => {
      typeInput(nameInput, 'やまだ');
    });
    expect(furiganaInput.value).toBe('やまだ');

    await act(async () => {
      cleanupStoryTeardowns();
    });

    // The component is unmounted, so furigana state no longer updates. This test guards the
    // registerStoryTeardown wiring; the actual destroy() call lives in the useEffect cleanup.
    await act(async () => {
      typeInput(nameInput, 'たろう');
    });
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('Vue story teardown unmounts its bound AutoKana instance', async () => {
    const render = vueStoryMeta.render as (args: { katakana: 'hiragana' }) => HTMLElement;
    const container = render({ katakana: 'hiragana' });
    const nameInput = container.querySelector('input') as HTMLInputElement;
    const furiganaInput = container.querySelectorAll('input')[1] as HTMLInputElement;

    typeInput(nameInput, 'やまだ');
    await nextTick();
    expect(furiganaInput.value).toBe('やまだ');

    cleanupStoryTeardowns();

    // The component is unmounted, so furigana state no longer updates. This test guards the
    // registerStoryTeardown wiring; the actual destroy() call lives in onUnmounted.
    typeInput(nameInput, 'たろう');
    await nextTick();

    expect(furiganaInput.value).toBe('やまだ');
  });

  test('stops at the first failing teardown and clears the registry', () => {
    const firstError = new Error('first teardown failed');
    const failingTeardown = vi.fn(() => {
      throw firstError;
    });
    const succeedingTeardown = vi.fn();
    registerStoryTeardown(failingTeardown);
    registerStoryTeardown(succeedingTeardown);

    expect(() => cleanupStoryTeardowns()).toThrow(firstError);
    expect(failingTeardown).toHaveBeenCalledOnce();
    expect(succeedingTeardown).not.toHaveBeenCalled();

    // The registry is cleared even after a failure, so a re-run does not replay stale teardowns.
    cleanupStoryTeardowns();
    expect(succeedingTeardown).not.toHaveBeenCalled();
  });
});
