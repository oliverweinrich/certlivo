// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { loadOptions } from './options.js';
import { parseRoutes, routeHosts } from './routes.js';
import type { Config, GetEnv } from './types.js';

export const loadConfig = (get: GetEnv): Config => {
  const routes = parseRoutes(get('ROUTES_JSON'));
  const hosts = routeHosts(routes);
  return { routes, hosts, data: '/data', ...loadOptions(get, hosts) };
};
