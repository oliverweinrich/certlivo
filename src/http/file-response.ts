// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import type { FileHandle } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { pipeline } from 'node:stream/promises';
import { byteRange, fileHeaders, unchanged } from './file-headers.js';
import { reply } from './response.js';

export const sendFile = async (
  file: FileHandle,
  relative: string,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> => {
  try {
    const info = await file.stat();
    const tag = fileHeaders(response, relative, info);
    if (unchanged(request, tag, info.mtime)) {
      response.writeHead(304);
      response.end();
      return;
    }
    const rawRange = request.headers.range;
    const ifRange =
      typeof request.headers['if-range'] === 'string'
        ? request.headers['if-range']
        : undefined;
    const allowRange =
      !ifRange ||
      ifRange === tag ||
      Date.parse(ifRange) >= Math.trunc(info.mtimeMs / 1000) * 1000;
    const range =
      rawRange && allowRange ? byteRange(rawRange, info.size) : undefined;
    if (range === null) {
      response.setHeader('Content-Range', `bytes */${info.size}`);
      reply(response, 416);
      return;
    }
    if (range)
      response.setHeader(
        'Content-Range',
        `bytes ${range.start}-${range.end}/${info.size}`,
      );
    response.setHeader(
      'Content-Length',
      range ? range.end - range.start + 1 : info.size,
    );
    response.writeHead(range ? 206 : 200);
    if (request.method === 'HEAD' || info.size === 0) {
      response.end();
      return;
    }
    await pipeline(
      file.createReadStream({ ...range, autoClose: false }),
      response,
    );
  } finally {
    await file.close();
  }
};
