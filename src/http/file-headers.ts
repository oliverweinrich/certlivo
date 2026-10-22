// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { extname } from 'node:path';
import type { Stats } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';

const mime: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
};
export const fileHeaders = (
  response: ServerResponse,
  path: string,
  stat: Stats,
): string => {
  const tag =
    '"' +
    stat.size.toString(16) +
    '-' +
    Math.trunc(stat.mtimeMs).toString(16) +
    '"';
  response.setHeader(
    'Content-Type',
    mime[extname(path).toLowerCase()] || 'application/octet-stream',
  );
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('ETag', tag);
  response.setHeader('Last-Modified', stat.mtime.toUTCString());
  response.setHeader('Accept-Ranges', 'bytes');
  return tag;
};
export const unchanged = (
  request: IncomingMessage,
  tag: string,
  modified: Date,
): boolean => {
  const match = request.headers['if-none-match'];
  if (match)
    return match
      .split(',')
      .some(
        (value) =>
          value.trim().replace(/^W\//, '') === tag || value.trim() === '*',
      );
  const since = request.headers['if-modified-since'];
  return (
    !!since &&
    Math.floor(modified.getTime() / 1000) <=
      Math.floor(Date.parse(since) / 1000)
  );
};
export type ByteRange = Readonly<{ start: number; end: number }>;
export const byteRange = (raw: string, size: number): ByteRange | null => {
  const parts = /^bytes=(\d*)-(\d*)$/.exec(raw);
  if (!parts || (!parts[1] && !parts[2])) return null;
  const start = parts[1]
    ? Number(parts[1])
    : Math.max(0, size - Number(parts[2]));
  const end =
    parts[1] && parts[2] ? Math.min(size - 1, Number(parts[2])) : size - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start > end ||
    start >= size
  )
    return null;
  return { start, end };
};
