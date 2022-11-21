import configure from '../configure';
import hasDependency from '../hasDependency';
import type { Loader } from '../Loader';
import type { StoryshotsOptions } from '../../api/StoryshotsOptions';

function test(options: StoryshotsOptions): boolean {
  return options.framework === 'rax' || (!options.framework && hasDependency('@storybook/rax'));
}

function load(options: StoryshotsOptions) {
  globalThis.STORYBOOK_ENV = 'rax';

  let mockStartedAPI: any;

  jest.mock('@storybook/core-client', () => {
    const coreClientAPI = jest.requireActual('@storybook/core-client');

    return {
      ...coreClientAPI,
      start: (...args: any[]) => {
        mockStartedAPI = coreClientAPI.start(...args);
        return mockStartedAPI;
      },
    };
  });

  jest.mock('@storybook/rax', () => {
    const renderAPI = jest.requireActual('@storybook/rax');

    renderAPI.addDecorator = mockStartedAPI.clientApi.addDecorator;
    renderAPI.addParameters = mockStartedAPI.clientApi.addParameters;

    return renderAPI;
  });

  // eslint-disable-next-line global-require
  const storybook = require('@storybook/rax');

  configure({
    ...options,
    storybook,
  });

  return {
    framework: 'rax' as const,
    renderTree: jest.requireActual('./renderTree').default,
    renderShallowTree: () => {
      throw new Error('Shallow renderer is not supported for rax');
    },
    storybook,
  };
}

const raxLoader: Loader = {
  load,
  test,
};

export default raxLoader;