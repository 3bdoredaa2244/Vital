import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

/**
 * TanStack Start router entry. The root route is declared with
 * `createRootRouteWithContext<{ queryClient: QueryClient }>()`, so the client
 * has to be supplied here as router context.
 */
export function getRouter() {
  const queryClient = new QueryClient();

  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    scrollRestoration: true,
  });
}
