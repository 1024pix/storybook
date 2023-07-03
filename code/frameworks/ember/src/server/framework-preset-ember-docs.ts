import { findDistFile } from '../util';
import type { StorybookConfig } from '@storybook/types';
import { hasDocsOrControls } from '@storybook/docs-tools';

export const previewAnnotations: StorybookConfig['previewAnnotations'] = (entry = [], options) => {
  if (!hasDocsOrControls(options)) return entry;
  return [...entry, findDistFile(__dirname, 'client/docs/config')];
};
