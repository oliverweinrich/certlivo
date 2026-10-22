// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import type { Config, GetEnv, Host } from './types.js';

type Options = Omit<Config, 'routes' | 'hosts' | 'data'>;
const size = (raw: string, maximum: number): number => {
  const parts = /^([1-9][0-9]*)([km])$/.exec(raw);
  if (!parts) throw new Error('Invalid buffer/body size');
  const bytes = Number(parts[1]) * (parts[2] === 'm' ? 1024 * 1024 : 1024);
  if (bytes > maximum) throw new Error('Buffer/body size exceeds limit');
  return bytes;
};
const acmeOptions = (
  get: GetEnv,
  hosts: readonly Host[],
): Pick<Options, 'environment' | 'directory' | 'email'> => {
  const environment = get('ACME_ENV') || 'production';
  if (environment !== 'production' && environment !== 'staging')
    throw new Error('Invalid ACME_ENV');
  const directory =
    get('ACME_DIRECTORY_URL') ||
    (environment === 'staging'
      ? 'https://acme-staging-v02.api.letsencrypt.org/directory'
      : 'https://acme-v02.api.letsencrypt.org/directory');
  const url = new URL(directory);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash)
    throw new Error('Invalid ACME directory');
  const email = get('ACME_EMAIL');
  if (
    hosts.some((host) => host.tls) &&
    (!/^[^\s<>@]+@[^\s<>@]+$/.test(email) || get('ACME_AGREE_TOS') !== 'true')
  )
    throw new Error('HTTPS requires ACME_EMAIL and ACME_AGREE_TOS=true');
  return { environment, directory, email };
};
export const loadOptions = (get: GetEnv, hosts: readonly Host[]): Options => {
  const logLevel = get('LOG_LEVEL') || 'info';
  if (
    logLevel !== 'debug' &&
    logLevel !== 'info' &&
    logLevel !== 'warn' &&
    logLevel !== 'error'
  )
    throw new Error('Invalid LOG_LEVEL');
  const access = get('ACCESS_LOG') || 'off';
  if (!['off', 'on'].includes(access)) throw new Error('Invalid ACCESS_LOG');
  for (const key of ['DOMAINS', 'SITE_MODE', 'UPSTREAM_URL', 'SITES_JSON']) {
    if (get(key)) throw new Error(key + ' is unsupported; use ROUTES_JSON');
  }
  return {
    ...acmeOptions(get, hosts),
    logLevel,
    accessLog: access === 'on',
    headerSize: size(get('CLIENT_HEADER_BUFFER_SIZE') || '16k', 128 * 1024),
    upstreamSize: size(get('UPSTREAM_HEADER_BUFFER_SIZE') || '16k', 128 * 1024),
    bodySize: size(get('MAX_BODY_SIZE') || '10m', 1024 * 1024 * 1024),
  };
};
