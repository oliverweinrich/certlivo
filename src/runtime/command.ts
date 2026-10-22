// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { request } from 'node:http';

export const command = (name: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (!['healthcheck', 'status', 'renew'].includes(name)) {
      reject(new Error('Usage: certlivo [healthcheck|status|renew]'));
      return;
    }
    const call = request(
      {
        socketPath: '/data/run/control.sock',
        path: name === 'renew' ? '/renew' : '/status',
        method: name === 'renew' ? 'POST' : 'GET',
      },
      (response): void => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string): void => {
          body += chunk;
          if (body.length > 1048576)
            call.destroy(new Error('Unexpected control response'));
        });
        response.on('end', (): void => {
          if (response.statusCode !== 200) {
            reject(new Error('Control command failed'));
            return;
          }
          try {
            if (name === 'healthcheck') {
              const status: unknown = JSON.parse(body);
              if (
                !status ||
                typeof status !== 'object' ||
                !('ready' in status) ||
                status.ready !== true
              )
                throw new Error('Gateway not ready');
            } else process.stdout.write(body + '\n');
            resolve();
          } catch (error) {
            reject(
              error instanceof Error ? error : new Error('Invalid status'),
            );
          }
        });
        response.on('error', reject);
      },
    );
    call.setTimeout(name === 'renew' ? 120000 : 3000, (): void => {
      call.destroy(new Error('Control request timed out'));
    });
    call.on('error', reject);
    call.end();
  });
