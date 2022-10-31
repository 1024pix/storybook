import React from 'react';
import { IconButton, Icons } from '@storybook/components';
import { Consumer, type Combo } from '@storybook/api';
import type { Addon_Type } from '@storybook/types';
import { Addon_TypesEnum } from '@storybook/types';

const menuMapper = ({ api, state }: Combo) => ({
  isVisible: state.layout.showPanel,
  singleStory: state.singleStory,
  panelPosition: state.layout.panelPosition,
  toggle: () => api.togglePanel(),
});

export const addonsTool: Addon_Type = {
  title: 'addons',
  id: 'addons',
  type: Addon_TypesEnum.TOOL,
  match: ({ viewMode }) => viewMode === 'story',
  render: () => (
    <Consumer filter={menuMapper}>
      {({ isVisible, toggle, singleStory, panelPosition }) =>
        !singleStory &&
        !isVisible && (
          <>
            <IconButton aria-label="Show addons" key="addons" onClick={toggle} title="Show addons">
              <Icons icon={panelPosition === 'bottom' ? 'bottombar' : 'sidebaralt'} />
            </IconButton>
          </>
        )
      }
    </Consumer>
  ),
};
