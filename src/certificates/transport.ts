// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import type { Request, Response } from '@root/acme';

// The injected ACME transport accepts only the configured issuer origin. This also
// blocks the library's maintainer-registration request before any network access.
export const createTransport = (
  directory: string,
  deadline: number,
): ((options: Request) => Promise<Response>) => {
  const origin = new URL(directory).origin;
  return async (options): Promise<Response> => {
    const url = new URL(options.url);
    if (url.protocol !== 'https:' || url.origin !== origin)
      throw new Error('ACME request outside configured issuer origin');
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('ACME operation deadline exceeded');
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      ...(options.body === undefined ? {} : { body: options.body }),
      redirect: 'error',
      signal: AbortSignal.timeout(Math.min(15000, remaining)),
    });
    const text = await response.text();
    const body: unknown =
      text && response.headers.get('content-type')?.includes('json')
        ? JSON.parse(text)
        : text;
    if (response.status >= 400 && response.status !== 400)
      throw new Error('ACME issuer returned HTTP ' + String(response.status));
    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers),
      body,
    };
  };
};
