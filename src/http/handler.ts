// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Certificates } from '../certificates/index.js';
import { matchRoute } from '../config/index.js';
import type { Config, Route } from '../config/index.js';
import type { Log } from '../runtime/log.js';
import { errorCode } from '../state/index.js';
import { createProxy } from './proxy.js';
import { reply } from './response.js';
import { certificateResponse } from './tls-response.js';
import { serveStatic } from './static-files.js';

export type Gateway = ReturnType<typeof createGateway>;
export const createGateway = (
  config: Config,
  certificates: Certificates,
  log: Log,
): {
  request: (
    secure: boolean,
  ) => (request: IncomingMessage, response: ServerResponse) => void;
  proxy: ReturnType<typeof createProxy>;
  route: (
    request: IncomingMessage,
  ) => Readonly<{ route: Route | undefined; url: URL }>;
} => {
  const proxy = createProxy(config);
  const route = (
    request: IncomingMessage,
  ): Readonly<{ route: Route | undefined; url: URL }> => {
    const host = request.headers.host;
    if (!host || !/^[a-zA-Z0-9.-]+(?::[0-9]+)?$/.test(host))
      throw new URIError('Invalid Host');
    const domain = host.split(':')[0]?.toLowerCase() || '';
    const raw = request.url || '/';
    if (!raw.startsWith('/') || raw.startsWith('//'))
      throw new URIError('Invalid request target');
    const url = new URL(raw, 'http://' + domain);
    return { route: matchRoute(config.routes, domain, url.pathname), url };
  };
  const handle = async (
    secure: boolean,
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> => {
    const { route: selected, url } = route(request);
    if (secure) url.protocol = 'https:';
    const host = config.hosts.find((item) => item.name === url.hostname);
    if (!host) {
      request.socket.destroy();
      return;
    }
    if (secure && !host.tls) {
      reply(response, 404);
      return;
    }
    if (
      request.rawHeaders.some(
        (value) => Buffer.byteLength(value) > config.headerSize,
      )
    ) {
      reply(response, 400);
      return;
    }
    if (config.accessLog)
      log('info', 'request', {
        host: host.name,
        method: request.method || '',
        path: url.pathname,
      });
    if (certificateResponse(host, certificates, secure, request, response, url))
      return;
    if (['TRACE', 'CONNECT'].includes(request.method || '')) {
      reply(response, 405);
      return;
    }
    if (!selected) {
      reply(response, 404);
      return;
    }
    if (selected.kind === 'static') {
      await serveStatic(selected, request, response, url);
      return;
    }
    await proxy.web(selected, request, response, secure);
  };
  return {
    proxy,
    route,
    request:
      (secure): ReturnType<Gateway['request']> =>
      (request, response): void => {
        void handle(secure, request, response).catch((error: unknown): void => {
          log('warn', 'request failed', { code: errorCode(error) });
          reply(response, error instanceof URIError ? 400 : 500);
        });
      },
  };
};
