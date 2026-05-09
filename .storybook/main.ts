import type { StorybookConfig } from '@storybook/html-vite';
import react from '@vitejs/plugin-react';

const config: StorybookConfig = {
  framework: '@storybook/html-vite',
  stories: ['../stories/**/*.stories.@(ts|tsx|js)'],
  viteFinal: async (config) => {
    config.plugins = config.plugins ?? [];
    config.plugins.push(react());
    return config;
  },
};

export default config;
