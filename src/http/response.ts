// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import type { ServerResponse } from 'node:http';

export const reply = (
  response: ServerResponse,
  status: number,
  text = '',
): void => {
  if (response.headersSent) {
    response.destroy();
    return;
  }
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
  });
  response.end(text);
};
export const redirect = (response: ServerResponse, location: string): void => {
  response.writeHead(308, { Location: location, 'Content-Length': 0 });
  response.end();
};
