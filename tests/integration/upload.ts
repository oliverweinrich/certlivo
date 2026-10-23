// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { once } from 'node:events';
import { setImmediate } from 'node:timers/promises';
import type { ClientRequest } from 'node:http';
export const uploadBody = async (
  operation: ClientRequest,
  body: string | Buffer | readonly Buffer[] | undefined,
  signal: AbortSignal,
): Promise<void> => {
  const chunks =
    typeof body === 'string'
      ? [Buffer.from(body)]
      : Buffer.isBuffer(body)
        ? [body]
        : body || [];
  try {
    for (const chunk of chunks)
      for (let offset = 0; offset < chunk.length; offset += 16384) {
        if (signal.aborted || operation.destroyed) return;
        if (!operation.write(chunk.subarray(offset, offset + 16384)))
          await once(operation, 'drain', { signal });
        // Yield to socket reads even when the kernel accepts writes immediately.
        await setImmediate(undefined, { signal });
      }
  } catch (error) {
    if (!signal.aborted) throw error;
    return;
  }
  if (!operation.writableEnded && !operation.destroyed) operation.end();
};
