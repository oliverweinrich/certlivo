// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { constants, mkdirSync, openSync, closeSync } from 'node:fs';
import { join } from 'node:path';

// The child locks the inherited open file description; its parent keeps the
// descriptor open for its lifetime. No shell or supervisor is necessary.
export const acquireLock = (directory: string): void => {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const descriptor = openSync(
    join(directory, 'controller.lock'),
    constants.O_CREAT | constants.O_RDWR | constants.O_NOFOLLOW,
    0o600,
  );
  const result = spawnSync('flock', ['-n', '3'], {
    stdio: ['ignore', 'ignore', 'ignore', descriptor],
    timeout: 5000,
  });
  if (result.error || result.status !== 0) {
    closeSync(descriptor);
    throw new Error('Certificate state is already in use or cannot be locked.');
  }
};
