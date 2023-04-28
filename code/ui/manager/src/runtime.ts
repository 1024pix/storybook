import { global } from '@storybook/global';

import type { Channel } from '@junk-temporary-prototypes/channels';
import type { AddonStore } from '@junk-temporary-prototypes/manager-api';
import { addons } from '@junk-temporary-prototypes/manager-api';
import type { Addon_Types, Addon_Config } from '@junk-temporary-prototypes/types';
import * as postMessage from '@junk-temporary-prototypes/channel-postmessage';
import * as webSocket from '@junk-temporary-prototypes/channel-websocket';
import { CHANNEL_CREATED } from '@junk-temporary-prototypes/core-events';
import Provider from './provider';
import { renderStorybookUI } from './index';

import { values } from './globals/runtime';
import { Keys } from './globals/types';

const { FEATURES, SERVER_CHANNEL_URL } = global;

class ReactProvider extends Provider {
  private addons: AddonStore;

  // @ts-expect-error Unused, possibly remove, leaving, because it could be accessed even though it is private
  private channel: Channel;

  private serverChannel?: Channel;

  constructor() {
    super();

    const postMessageChannel = postMessage.createChannel({ page: 'manager' });

    addons.setChannel(postMessageChannel);

    postMessageChannel.emit(CHANNEL_CREATED);

    this.addons = addons;
    this.channel = postMessageChannel;

    if (FEATURES?.storyStoreV7 && SERVER_CHANNEL_URL) {
      const serverChannel = webSocket.createChannel({ url: SERVER_CHANNEL_URL });
      this.serverChannel = serverChannel;
      addons.setServerChannel(this.serverChannel);
    }
  }

  getElements(type: Addon_Types) {
    return this.addons.getElements(type);
  }

  getConfig(): Addon_Config {
    return this.addons.getConfig();
  }

  handleAPI(api: unknown) {
    this.addons.loadAddons(api);
  }
}

const { document } = global;

const rootEl = document.getElementById('root');
renderStorybookUI(rootEl, new ReactProvider());

// Apply all the globals
Object.keys(Keys).forEach((key: keyof typeof Keys) => {
  global[Keys[key]] = values[key];
});
