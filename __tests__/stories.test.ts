import { describe, expect, test, vi } from 'vitest';
import { bind } from '../src/index';
import { cleanupStoryTeardowns, registerStoryTeardown } from '../stories/helpers';
import { setup, typeInput } from './setup';

describe('Storybook teardown', () => {
  test('cleans up registered AutoKana instances when a story is left', () => {
    setup();
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    const autokana = bind(nameInput, furiganaInput);
    registerStoryTeardown(() => autokana.destroy());

    typeInput(nameInput, 'やまだ');
    expect(furiganaInput.value).toBe('やまだ');

    cleanupStoryTeardowns();
    typeInput(nameInput, 'たろう');

    expect(furiganaInput.value).toBe('やまだ');
  });

  test('runs each teardown once and clears the registry', () => {
    const teardown = () => undefined;
    const registeredTeardown = vi.fn(teardown);
    registerStoryTeardown(registeredTeardown);

    cleanupStoryTeardowns();
    cleanupStoryTeardowns();

    expect(registeredTeardown).toHaveBeenCalledOnce();
  });
});
