import { baseGenerator } from '../baseGenerator';
import type { Generator } from '../types';

const generator: Generator = async (packageManager, npmOptions, options) => {
  await baseGenerator(packageManager, npmOptions, options, 'ember', {
    extraPackages: [
      // babel-plugin-ember-template-compilation is a peerDep of @storybook/ember
      'babel-plugin-ember-template-compilation',
    ],
    staticDir: 'dist',
  }, 'ember');
};

export default generator;
