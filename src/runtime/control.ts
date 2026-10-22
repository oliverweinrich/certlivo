// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { createServer } from 'node:http';
import { chmod, mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { errorCode } from '../state/index.js';
import type { Log } from './log.js';

export type Status = Readonly<{
  ready: boolean;
  updated: string;
  pid: number;
  hosts: readonly object[];
}>;
export const startControl = async (
  data: string,
  status: () => Status,
  renew: () => Promise<void>,
  log: Log,
): Promise<() => Promise<void>> => {
  const directory = join(data, 'run');
  const path = join(directory, 'control.sock');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  // The entrypoint's inherited flock is held before removing stale sockets.
  try {
    await unlink(path);
  } catch (error) {
    if (errorCode(error) !== 'ENOENT') throw error;
  }
  const server = createServer((request, response): void => {
    if (request.method === 'GET' && request.url === '/status') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(status()));
      return;
    }
    if (request.method === 'POST' && request.url === '/renew') {
      void renew()
        .then((): void => {
          response.writeHead(200);
          response.end('Renewal completed');
        })
        .catch((): void => {
          response.writeHead(503);
          response.end('Renewal failed');
        });
      return;
    }
    response.writeHead(404);
    response.end();
  });
  server.requestTimeout = 15000;
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(path, (): void => {
      server.off('error', reject);
      resolve();
    });
  });
  await chmod(path, 0o600);
  server.on('error', (): void => {
    log('error', 'control server failed');
    process.exitCode = 1;
  });
  return (): Promise<void> =>
    new Promise((resolve, reject) => {
      server.close((error): void => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
      server.closeAllConnections();
    });
};
