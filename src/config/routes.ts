// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { staticRoot, validHost, validProxy } from './targets.js';
import type { Host, Route } from './types.js';

const routeFields = (input: unknown): Omit<Route, 'kind'> => {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Invalid route object');
  if (
    !('host' in input) ||
    !('path' in input) ||
    !('target' in input) ||
    !('tls' in input)
  )
    throw new Error('Route requires host, path, target and tls');
  if (
    Object.keys(input).some(
      (key) => !['host', 'path', 'target', 'tls'].includes(key),
    )
  )
    throw new Error('Unknown route field');
  if (
    typeof input.host !== 'string' ||
    typeof input.path !== 'string' ||
    typeof input.target !== 'string' ||
    typeof input.tls !== 'boolean'
  )
    throw new Error('Invalid route field type');
  return {
    host: input.host,
    path: input.path,
    target: input.target,
    tls: input.tls,
  };
};
const parseRoute = (raw: unknown): Route => {
  const input = routeFields(raw);
  const host = input.host.toLowerCase();
  const path =
    input.path.length > 1 ? input.path.replace(/\/$/, '') : input.path;
  if (
    !validHost(host) ||
    !/^\/[a-zA-Z0-9/_-]*$/.test(path) ||
    path.includes('//')
  )
    throw new Error('Invalid route host or path');
  const directory = staticRoot(input.target);
  if (!directory && !validProxy(input.target))
    throw new Error('Invalid route target');
  return {
    host,
    path,
    target: directory ? 'file://' + directory : input.target,
    tls: input.tls,
    kind: directory ? 'static' : 'proxy',
  };
};
export const parseRoutes = (raw: string): readonly Route[] => {
  if (Buffer.byteLength(raw) > 65536)
    throw new Error('ROUTES_JSON exceeds 64 KiB');
  const input: unknown = JSON.parse(raw);
  if (!Array.isArray(input) || input.length < 1 || input.length > 128)
    throw new Error('ROUTES_JSON must contain 1..128 routes');
  const routes = input.map((value: unknown): Route => parseRoute(value));
  const seen = new Set<string>();
  const modes = new Map<string, boolean>();
  for (const route of routes) {
    const key = route.host + route.path;
    if (seen.has(key)) throw new Error('Duplicate host/path route');
    if (modes.has(route.host) && modes.get(route.host) !== route.tls)
      throw new Error('Conflicting TLS settings');
    seen.add(key);
    modes.set(route.host, route.tls);
  }
  return routes;
};
export const routeHosts = (routes: readonly Route[]): readonly Host[] => [
  ...new Map(
    routes.map((route): [string, Host] => [
      route.host,
      { name: route.host, tls: route.tls },
    ]),
  ).values(),
];
export const matchRoute = (
  routes: readonly Route[],
  host: string,
  path: string,
): Route | undefined =>
  routes
    .filter(
      (route) =>
        route.host === host &&
        (route.path === '/' ||
          path === route.path ||
          path.startsWith(route.path + '/')),
    )
    .sort((left, right) => right.path.length - left.path.length)[0];
