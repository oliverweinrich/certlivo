// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { existsSync, renameSync, rmSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { run } from '../scripts/lib.ts';
export const download = (
  url: string,
  destination: string,
  cached = true,
): void => {
  if (cached && existsSync(destination)) return;
  if (!url.startsWith('https://')) throw new Error('Downloads require HTTPS');
  mkdirSync(dirname(destination), { recursive: true });
  const temporary = destination + '.download';
  try {
    run('curl', [
      '--fail',
      '--silent',
      '--show-error',
      '--location',
      '--proto',
      '=https',
      '--proto-redir',
      '=https',
      '--retry',
      '2',
      '--connect-timeout',
      '15',
      '--max-time',
      '180',
      url,
      '-o',
      temporary,
    ]);
    renameSync(temporary, destination);
  } finally {
    rmSync(temporary, { force: true });
  }
};
