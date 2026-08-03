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
