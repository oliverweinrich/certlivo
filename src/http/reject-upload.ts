// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import type { IncomingMessage, ServerResponse } from 'node:http';

export const rejectUpload = (
  request: IncomingMessage,
  response: ServerResponse,
): void => {
  // Flush the complete empty response before closing the write side. Closing
  // with unread input can reset the connection while a client is still writing.
  response.writeHead(413, { Connection: 'close', 'Content-Length': '0' });
  response.flushHeaders();
  const finish = (): void => {
    clearTimeout(deadline);
    request.off('end', finish);
    response.off('close', finish);
    if (!response.destroyed && !response.writableEnded) response.end();
  };
  const deadline = setTimeout(finish, 1000);
  deadline.unref();
  request.once('end', finish);
  response.once('close', finish);
  request.resume();
  if (request.complete) finish();
};
