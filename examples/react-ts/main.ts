import type { StorybookConfig } from '@storybook/react/types';

const config: StorybookConfig = {
  stories: [{ directory: './src', titlePrefix: 'Demo' }, './src/foo'],
  logLevel: 'debug',
  //framework: '@storybook/react',
  addons: [
    '@storybook/react',
    '@storybook/addon-essentials',
    '@storybook/addon-storysource',
    '@storybook/addon-storyshots',
  ],
  typescript: {
    check: true,
    checkOptions: {},
    reactDocgenTypescriptOptions: {
      propFilter: (prop) => ['label', 'disabled'].includes(prop.name),
    },
  },
  core: {
    builder: 'webpack4',
  },
  features: {
    postcss: false,
    // modernInlineRender: true,
    storyStoreV7: true,
    buildStoriesJson: true,
    babelModeV7: true,
  },
};

module.exports = config;
