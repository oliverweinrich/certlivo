// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Certificates } from '../certificates/index.js';
import type { Host } from '../config/index.js';
import { redirect, reply } from './response.js';

export const certificateResponse = (
  host: Host,
  certificates: Certificates,
  secure: boolean,
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
): boolean => {
  const challenge = /^\/\.well-known\/acme-challenge\/([a-zA-Z0-9_-]+)$/.exec(
    url.pathname,
  );
  if (!secure && host.tls && challenge) {
    const value = certificates.challenges.get(
      host.name + '/' + (challenge[1] || ''),
    );
    reply(response, value ? 200 : 404, value);
    return true;
  }
  if (host.tls && !secure) {
    if ((certificates.active.get(host.name)?.expires || 0) <= Date.now()) {
      reply(response, 503);
      return true;
    }
    redirect(response, 'https://' + host.name + (request.url || '/'));
    return true;
  }
  return false;
};
