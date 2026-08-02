import type { Preview } from '@storybook/html';

import { cleanupStoryTeardowns } from '../stories/helpers';

const preview: Preview = {
  beforeEach() {
    return cleanupStoryTeardowns;
  },
};

export default preview;
