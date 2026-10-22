// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { atomicWrite, prepareState } from '../../../src/state/files.js';

await test('state writes remain private and reject a changed ACME directory', async (): Promise<void> => {
  const directory = await mkdtemp(join(tmpdir(), 'certlivo-state-'));
  try {
    const root = await prepareState(
      directory,
      'staging',
      'https://ca.test/dir',
    );
    const path = join(root, 'fixture.json');
    await atomicWrite(path, 'first');
    await atomicWrite(path, 'second');
    assert.equal(await readFile(path, 'utf8'), 'second');
    assert.equal((await stat(path)).mode & 0o777, 0o600);
    await assert.rejects(
      prepareState(directory, 'staging', 'https://other.test/dir'),
      /directory changed/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
