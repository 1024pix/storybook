/// <reference types="webpack-env" />

export { storiesOf, configure, forceReRender, raw } from './client/preview';
export * from './types';

// optimization: stop HMR propagation in webpack
if (typeof module !== 'undefined') module?.hot?.decline();
