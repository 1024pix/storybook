import { global } from '@storybook/global';
import React, { useCallback } from 'react';
import type { ReactNode, ReactElement } from 'react';

import * as R from 'react-router-dom';
import { ToggleVisibility } from './visibility';
import { queryFromString, parsePath, getMatch } from './utils';
import type { LinkProps, NavigateOptions, RenderData } from './types';

const { document } = global;

interface MatchingData {
  match: null | { path: string };
}

interface LocationProps {
  children: (renderData: RenderData) => any;
}

interface MatchPropsStartsWith {
  path: string;
  startsWith: true;
  children: (matchingData: MatchingData) => ReactNode;
}
interface MatchPropsDefault {
  path: string | RegExp;
  startsWith: false;
  children: (matchingData: MatchingData) => ReactNode;
}

interface RoutePropsStartsWith {
  path: string;
  startsWith: true;
  hideOnly?: boolean;
  children: ReactNode;
}
interface RoutePropsDefault {
  path: string | RegExp;
  startsWith?: false;
  hideOnly?: boolean;
  children: ReactNode;
}

const isRoutePropsDefault = (
  props: RoutePropsDefault | RoutePropsStartsWith
): props is RoutePropsDefault => {
  return !props.startsWith;
};

const getBase = () => `${document.location.pathname}?`;

// const queryNavigate: NavigateFn = (to: string | number, options?: NavigateOptions<{}>) =>
//   typeof to === 'number' ? navigate(to) : navigate(`${getBase()}path=${to}`, options);

export const useNavigate = () => {
  const navigate = R.useNavigate();

  return useCallback((to: R.To | number, { plain, ...options } = {} as NavigateOptions) => {
    if (typeof to === 'string' && to.startsWith('#')) {
      document.location.hash = to;
      return undefined;
    }
    if (typeof to === 'string') {
      const target = plain ? to : `?path=${to}`;
      return navigate(target, options);
    }
    if (typeof to === 'number') {
      return navigate(to);
    }

    return undefined;
  }, []);
};

// A component that will navigate to a new location/path when clicked
export const Link = ({ to, children, ...rest }: LinkProps) => (
  <R.Link to={`${getBase()}path=${to}`} {...rest}>
    {children}
  </R.Link>
);
Link.displayName = 'QueryLink';

// A render-prop component where children is called with a location
// and will be called whenever it changes when it changes
export const Location = ({ children }: LocationProps) => {
  const location = R.useLocation();
  const { path, singleStory } = queryFromString(location.search);
  const { viewMode, storyId, refId } = parsePath(path);

  return (
    <>
      {children({
        path,
        location,
        viewMode,
        storyId,
        refId,
        singleStory: singleStory === 'true',
      })}
    </>
  );
};
Location.displayName = 'QueryLocation';

// A render-prop component for rendering when a certain path is hit.
// It's immensely similar to `Location` but it receives an addition data property: `match`.
// match has a truthy value when the path is hit.
function Match(props: MatchPropsStartsWith): ReactElement;
function Match(props: MatchPropsDefault): ReactElement;
function Match({
  children,
  path: targetPath,
  startsWith = false,
}: MatchPropsStartsWith | MatchPropsDefault) {
  return (
    <Location>
      {({ path: urlPath, ...rest }) =>
        children({
          match: getMatch(urlPath, targetPath, startsWith),
          ...rest,
        })
      }
    </Location>
  );
}
Match.displayName = 'QueryMatch';

// A component to conditionally render children based on matching a target path
function Route(props: RoutePropsDefault): ReactElement;
function Route(props: RoutePropsStartsWith): ReactElement;
function Route(input: RoutePropsDefault | RoutePropsStartsWith) {
  let propsA: RoutePropsStartsWith = input as RoutePropsStartsWith;
  let propsB: RoutePropsDefault = input as RoutePropsDefault;

  if (isRoutePropsDefault(input)) {
    propsB = { ...input };
    propsB.startsWith = false;
  } else {
    propsA = input;
  }

  const { children, hideOnly = false } = propsA || propsB;
  return (
    <Match {...(propsA || propsB)}>
      {({ match }) => {
        if (hideOnly) {
          return <ToggleVisibility hidden={!match}>{children}</ToggleVisibility>;
        }
        return match ? children : null;
      }}
    </Match>
  );
}
Route.displayName = 'Route';

export { Route, Match };

export const LocationProvider: typeof R.BrowserRouter = (...args) => R.BrowserRouter(...args);
export const BaseLocationProvider: typeof R.Router = (...args) => R.Router(...args);
