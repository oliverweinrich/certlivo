// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { staticRoot } from '../config/index.js';
import type { Route } from '../config/index.js';
import { errorCode } from '../state/index.js';
import { openPublicFile, publicPath } from './file-access.js';
import { sendFile } from './file-response.js';
import { redirect, reply } from './response.js';

export const serveStatic = async (
  route: Route,
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
): Promise<void> => {
  if (!['GET', 'HEAD'].includes(request.method || '')) {
    reply(response, 403);
    return;
  }
  const directory = staticRoot(route.target);
  if (!directory) throw new Error('Static route was not validated');
  try {
    const path = decodeURIComponent(url.pathname);
    if (
      path.split('/').some((part) => part.startsWith('.')) ||
      path.includes('\0') ||
      path.includes('\\')
    ) {
      reply(response, 404);
      return;
    }
    let relative = path
      .slice(route.path === '/' ? 1 : route.path.length)
      .replace(/^\//, '');
    const candidate = await publicPath(directory, relative);
    if ((await stat(candidate)).isDirectory()) {
      if (!path.endsWith('/')) {
        redirect(response, url.origin + path + '/' + url.search);
        return;
      }
      relative += (relative ? '/' : '') + 'index.html';
      try {
        await stat(await publicPath(directory, relative));
      } catch (error) {
        if (errorCode(error) === 'ENOENT') {
          reply(response, 403);
          return;
        }
        throw error;
      }
    }
    const file = await openPublicFile(directory, relative);
    await sendFile(file, relative, request, response);
  } catch (error) {
    const code = errorCode(error);
    if (['ENOENT', 'ENOTDIR'].includes(code)) {
      reply(response, 404);
      return;
    }
    if (['EACCES', 'EPERM', 'ELOOP'].includes(code)) {
      reply(response, 403);
      return;
    }
    if (error instanceof URIError) {
      reply(response, 400);
      return;
    }
    throw error;
  }
};
