// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { createProxyServer } from 'httpxy';
import type { ClientRequest, IncomingMessage, ServerResponse } from 'node:http';
import type { Socket } from 'node:net';
import { Transform } from 'node:stream';
import type { TransformCallback } from 'node:stream';
import type { Config, Route } from '../config/index.js';
import { reply } from './response.js';
import { rejectUpload } from './reject-upload.js';

const hopHeaders = [
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];
const prepareHeaders = (
  request: IncomingMessage,
  secure: boolean,
  upgrade: boolean,
): void => {
  const host = request.headers.host;
  const chunked = request.headers['transfer-encoding'];
  const connection = (request.headers.connection || '')
    .split(',')
    .map((item) => item.trim().toLowerCase());
  for (const header of [...connection, ...hopHeaders, 'forwarded'])
    Reflect.deleteProperty(request.headers, header);
  if (host) request.headers.host = host;
  if (chunked) request.headers['transfer-encoding'] = 'chunked';
  request.headers['x-forwarded-for'] = request.socket.remoteAddress || '';
  request.headers['x-real-ip'] = request.socket.remoteAddress || '';
  request.headers['x-forwarded-proto'] = secure ? 'https' : 'http';
  request.headers['x-forwarded-host'] = request.headers.host || '';
  request.headers['x-forwarded-port'] = secure ? '443' : '80';
  if (upgrade) {
    request.headers.connection = 'upgrade';
    request.headers.upgrade = 'websocket';
  }
};
export const createProxy = (
  config: Config,
): {
  web: (
    route: Route,
    request: IncomingMessage,
    response: ServerResponse,
    secure: boolean,
  ) => Promise<void>;
  upgrade: (
    route: Route,
    request: IncomingMessage,
    socket: Socket,
    head: Buffer,
    secure: boolean,
  ) => Promise<void>;
} => {
  const outgoing = new WeakMap<IncomingMessage, ClientRequest>();
  const rejected = new WeakSet<IncomingMessage>();
  const proxy = createProxyServer({
    secure: true,
    prependPath: false,
    followRedirects: false,
    agent: false,
    proxyTimeout: 60000,
    timeout: 60000,
    ssl: { maxHeaderSize: config.upstreamSize },
  });
  proxy.on('proxyReq', (upstream, request): void => {
    if (rejected.has(request)) {
      upstream.destroy();
      return;
    }
    outgoing.set(request, upstream);
    const timer = setTimeout((): void => {
      upstream.destroy(new Error('Upstream connect timeout'));
    }, 5000);
    if (upstream.socket?.connecting)
      upstream.socket.once('connect', (): void => {
        clearTimeout(timer);
      });
    else clearTimeout(timer);
    upstream.once('response', (): void => {
      clearTimeout(timer);
    });
    upstream.once('close', (): void => {
      clearTimeout(timer);
    });
  });
  const web = async (
    route: Route,
    request: IncomingMessage,
    response: ServerResponse,
    secure: boolean,
  ): Promise<void> => {
    const length = Number(request.headers['content-length'] || 0);
    if (length > config.bodySize) {
      rejectUpload(request, response);
      return;
    }
    prepareHeaders(request, secure, false);
    let received = 0;
    const body = new Transform({
      transform(
        chunk: Buffer,
        _encoding: BufferEncoding,
        callback: TransformCallback,
      ): void {
        received += chunk.length;
        if (received > config.bodySize) {
          callback(new Error('Request body limit exceeded'));
          return;
        }
        callback(null, chunk);
      },
    });
    body.once('error', (): void => {
      rejected.add(request);
      request.unpipe(body);
      outgoing.get(request)?.destroy();
      if (response.headersSent) {
        response.destroy();
        return;
      }
      rejectUpload(request, response);
    });
    request.pipe(body);
    try {
      await proxy.web(request, response, {
        target: route.target,
        buffer: body,
      });
    } catch {
      if (!rejected.has(request)) reply(response, 502);
    }
  };
  const upgrade = async (
    route: Route,
    request: IncomingMessage,
    socket: Socket,
    head: Buffer,
    secure: boolean,
  ): Promise<void> => {
    prepareHeaders(request, secure, true);
    try {
      await proxy.ws(request, socket, { target: route.target }, head);
    } catch {
      socket.destroy();
    }
  };
  return { web, upgrade };
};
