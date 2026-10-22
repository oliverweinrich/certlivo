// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { json, read, write } from '../../../scripts/lib.ts';
import { readVersion } from '../../../release/context.ts';
import { setVersion } from '../../../release/set-version.ts';
import { assertUnused } from '../../../release/publish.ts';
await test('version changes synchronize the only manifest, lock and examples; invalid versions do not write', (): void => {
  const root = mkdtempSync(join(tmpdir(), 'certlivo-version-'));
  try {
    write(join(root, 'VERSION'), '1.0.0\n');
    write(join(root, 'README.md'), 'Release 1.0.0\n');
    write(
      join(root, 'examples/compose.demo.yaml'),
      'image: oliverweinrich/certlivo:1.0.0\n',
    );
    write(join(root, 'package.json'), '{"version":"1.0.0"}');
    write(
      join(root, 'package-lock.json'),
      '{"version":"1.0.0","packages":{"":{"version":"1.0.0"}}}',
    );
    for (const invalid of ['v1.0.1', '01.0.1', '1.2', '1.0.1;touch forbidden'])
      assert.throws(() => {
        setVersion(invalid, root);
      });
    assert.equal(read(join(root, 'VERSION')), '1.0.0\n');
    setVersion('1.0.1', root);
    assert.equal(json(join(root, 'package.json')).version, '1.0.1');
    assert.equal(json(join(root, 'package-lock.json')).version, '1.0.1');
    assert.match(
      read(join(root, 'examples/compose.demo.yaml')),
      /certlivo:1\.0\.1/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
await test('publication permits only confirmed missing tags and release; no writes in preflight', async (): Promise<void> => {
  const missing = (): Readonly<{
    status: number;
    stdout: string;
    stderr: string;
  }> => ({ status: 1, stdout: '', stderr: 'HTTP 404' });
  for (const status of [200, 401, 403, 429, 500])
    await assert.rejects(
      assertUnused('1.0.1', () => Promise.resolve(status), missing),
    );
  await assertUnused('1.0.1', () => Promise.resolve(404), missing);
  await assert.rejects(
    assertUnused(
      '1.0.1',
      () => Promise.resolve(404),
      () => ({ status: 1, stdout: '', stderr: 'HTTP 403' }),
    ),
  );
});

await test('version validation rejects drift in either lockfile version or the manifest', (): void => {
  const root = mkdtempSync(join(tmpdir(), 'certlivo-version-drift-'));
  try {
    write(join(root, 'VERSION'), '1.0.0\n');
    write(join(root, 'package.json'), '{"version":"1.0.0"}');
    for (const [top, entry] of [
      ['1.0.0', '1.0.0'],
      ['1.0.1', '1.0.0'],
      ['1.0.0', '1.0.1'],
    ]) {
      write(
        join(root, 'package-lock.json'),
        JSON.stringify({ version: top, packages: { '': { version: entry } } }),
      );
      if (top === '1.0.0' && entry === '1.0.0')
        assert.equal(readVersion(root), '1.0.0');
      else
        assert.throws(
          () => readVersion(root),
          /package-lock.json version differs/,
        );
    }
    write(join(root, 'package.json'), '{"version":"1.0.1"}');
    assert.throws(() => readVersion(root), /package.json version differs/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
