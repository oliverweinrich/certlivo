// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { isIP } from 'node:net';
import { posix } from 'node:path';

const label = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
export const validHost = (host: string): boolean =>
  host.length <= 253 &&
  host.includes('.') &&
  !isIP(host) &&
  host.split('.').every((part) => label.test(part));

export const staticRoot = (target: string): string | null => {
  if (!target.startsWith('file:///')) return null;
  const directory = target.slice(7).replace(/\/$/, '');
  if (!/^\/sites\/[a-zA-Z0-9_/-][a-zA-Z0-9._/-]*$/.test(directory)) return null;
  if (posix.normalize(directory) !== directory) return null;
  if (directory.split('/').some((part) => part.startsWith('.'))) return null;
  return directory;
};
export const validProxy = (target: string): boolean => {
  if (/[\s;{}$\\"]/.test(target)) return false;
  try {
    const url = new URL(target);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return false;
    if (
      url.pathname !== '/' ||
      /[/?#]/.test(target.slice(target.indexOf('://') + 3))
    )
      return false;
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    if (
      !isIP(hostname) &&
      !hostname.split('.').every((part) => label.test(part))
    )
      return false;
    return !url.port || Number(url.port) > 0;
  } catch {
    return false;
  }
};
