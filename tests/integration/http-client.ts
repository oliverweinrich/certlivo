// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readFileSync } from 'node:fs';
export type Reply = Readonly<{
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}>;
export type RequestOptions = Readonly<{
  method?: string;
  headers?: Record<string, string>;
  body?: string | Buffer | readonly Buffer[];
  ca?: string;
}>;
export const request = (
  address: string,
  options: RequestOptions = {},
): Promise<Reply> =>
  new Promise((resolve, reject) => {
    const url = new URL(address),
      secure = url.protocol === 'https:';
    const body = options.body;
    const headers = { ...options.headers };
    if (typeof body === 'string' || Buffer.isBuffer(body))
      headers['Content-Length'] = String(Buffer.byteLength(body));
    const transport = secure ? httpsRequest : httpRequest;
    const operation = transport(
      url,
      {
        method: options.method || 'GET',
        headers,
        ...(secure
          ? { ca: readFileSync(options.ca || '/fixtures/issued-ca.pem') }
          : {}),
        timeout: 10000,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.once('error', reject);
        response.once('end', () => {
          resolve({
            status: response.statusCode || 0,
            headers: response.headers,
            body: Buffer.concat(chunks).toString(),
          });
        });
      },
    );
    operation.once('timeout', () =>
      operation.destroy(new Error('Fixture request timeout')),
    );
    operation.once('error', reject);
    if (Array.isArray(body)) {
      for (const chunk of body) operation.write(chunk);
      operation.end();
    } else operation.end(body);
  });
export const record = (text: string): Record<string, unknown> => {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected fixture JSON object');
  return value as Record<string, unknown>;
};
