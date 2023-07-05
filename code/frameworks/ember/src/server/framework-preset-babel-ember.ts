import { findDistFile } from '../util';
import type { TransformOptions } from '@babel/core';
import type { StorybookConfig, Options } from '@storybook/types';

let emberOptions: any;

export function babel(config: TransformOptions, options: Options): TransformOptions {
  if (options && options.presetsList) {
    options.presetsList.forEach((e: any, index: number) => {
      if (e.preset && e.preset.emberOptions) {
        emberOptions = e.preset.emberOptions;
        if (options.presetsList) {
          // eslint-disable-next-line no-param-reassign
          delete options.presetsList[index].preset.emberOptions;
        }
      }
    });
  }

  const babelConfigPlugins = config.plugins || [];

  const extraPlugins = [
    [
      require.resolve('babel-plugin-ember-template-compilation'),
      {
        compilerPath: 'ember-source/dist/ember-template-compiler',
        enableLegacyModules: [
          'ember-cli-htmlbars'
          'ember-cli-htmlbars-inline-precompile',
          'htmlbars-inline-precompile'
        ],
        outputModuleOverrides: {
          '@ember/template-factory': {
            createTemplateFactory: [
              'createTemplateFactory',
              'ember-source/dist/packages/@ember/template-factory/index.js',
            ],
          },
        },
      },
    ],
  ];

  return {
    ...config,
    plugins: [...babelConfigPlugins, ...extraPlugins],
  };
}

export const previewAnnotations: StorybookConfig['previewAnnotations'] = (entry = []) => {
  return [...entry, findDistFile(__dirname, 'client/preview/config')];
};
