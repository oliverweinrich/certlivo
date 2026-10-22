// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import type { Server } from 'node:http';
import { Socket } from 'node:net';
import type { Certificates } from '../certificates/index.js';
import type { Config } from '../config/index.js';
import type { Gateway } from './handler.js';

const listen = (server: Server, port: number): Promise<void> =>
  new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '0.0.0.0', (): void => {
      server.off('error', reject);
      resolve();
    });
  });
export const startServers = async (
  config: Config,
  certificates: Certificates,
  gateway: Gateway,
): Promise<() => Promise<void>> => {
  const options = {
    maxHeaderSize: config.headerSize * 4,
    headersTimeout: 15000,
    requestTimeout: 60000,
    keepAliveTimeout: 5000,
  };
  const http = createHttpServer(options, gateway.request(false));
  const https = createHttpsServer(
    {
      ...options,
      minVersion: 'TLSv1.2',
      SNICallback: (name, callback): void => {
        const active = certificates.active.get(name.toLowerCase());
        if (!active || active.expires <= Date.now()) {
          callback(new Error('Unknown or unavailable HTTPS host'));
          return;
        }
        callback(null, active.context);
      },
    },
    gateway.request(true),
  );
  for (const [server, secure] of [
    [http, false],
    [https, true],
  ] as const) {
    server.setTimeout(60000);
    server.on('clientError', (_error, socket): void => {
      socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
    });
    server.on('connect', (_request, socket): void => {
      socket.end(
        'HTTP/1.1 405 Method Not Allowed\r\nConnection: close\r\n\r\n',
      );
    });
    server.on('upgrade', (request, socket, head): void => {
      try {
        if (!(socket instanceof Socket)) {
          socket.destroy();
          return;
        }
        const { route } = gateway.route(request);
        if (
          !route ||
          route.kind !== 'proxy' ||
          route.tls !== secure ||
          String(request.headers.upgrade).toLowerCase() !== 'websocket'
        ) {
          socket.destroy();
          return;
        }
        void gateway.proxy.upgrade(route, request, socket, head, secure);
      } catch {
        socket.destroy();
      }
    });
  }
  const sockets = new Set<Socket>();
  for (const server of [http, https])
    server.on('connection', (socket: Socket): void => {
      sockets.add(socket);
      socket.once('close', (): boolean => sockets.delete(socket));
    });
  await listen(http, 80);
  try {
    await listen(https, 443);
  } catch (error) {
    http.close();
    throw error;
  }
  return async (): Promise<void> => {
    const closing = [http, https].map(
      (server): Promise<void> =>
        new Promise((resolve) => {
          server.close((): void => {
            resolve();
          });
        }),
    );
    for (const socket of sockets) socket.destroy();
    await Promise.all(closing);
  };
};
