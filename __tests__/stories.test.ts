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
  test('attempts every teardown and rethrows an AggregateError after failures', () => {
    const firstError = new Error('first teardown failed');
    const failingTeardown = vi.fn(() => {
      throw firstError;
    });
    const succeedingTeardown = vi.fn();
    registerStoryTeardown(failingTeardown);
    registerStoryTeardown(succeedingTeardown);

    let caught: unknown;
    try {
      cleanupStoryTeardowns();
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(caught).toMatchObject({ name: 'AggregateError' });
    expect((caught as Error & { errors: unknown[] }).errors).toEqual([firstError]);
    expect(failingTeardown).toHaveBeenCalledOnce();
    expect(succeedingTeardown).toHaveBeenCalledOnce();

    cleanupStoryTeardowns();
    expect(succeedingTeardown).toHaveBeenCalledOnce();
  });
});
