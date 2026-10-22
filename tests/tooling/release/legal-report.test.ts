// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { hash, run, write } from '../../../scripts/lib.ts';
import { renderLegal } from '../../../release/legal-report.ts';
await test('license coverage rejects missing matching sources, provenance and npm evidence', (): void => {
  const work = mkdtempSync(join(tmpdir(), 'certlivo-legal-')),
    commit = 'a'.repeat(40),
    id = 'fixture-' + commit;
  try {
    write(
      join(work, 'packages.tsv'),
      `package\tversion\tlicense\torigin\tcommit\tarchitecture\nfixture\t1\tMIT\tfixture\t${commit}\tx86_64\n`,
    );
    const source = join(work, 'alpine', id),
      notices = join(work, 'licenses/alpine', id);
    write(join(source, 'VERIFIED'), `fixture\t1\t${commit}\n`);
    write(join(source, 'recipe/main/fixture/APKBUILD'), 'pkgname=fixture');
    write(join(source, 'sources/source.txt'), 'fixture source');
    write(
      join(source, 'source-definition-aarch64.txt'),
      'https://example.test/source',
    );
    write(join(notices, 'NOTICE'), 'Copyright fixture');
    for (const name of ['source-notices.tar.gz', 'raw-source-notices.tar.gz'])
      run('tar', ['-czf', join(notices, name), '-C', notices, 'NOTICE']);
    write(join(work, 'node/VERSION'), 'v24.0.0');
    write(join(work, 'node/source.tar.xz'), 'source');
    write(join(work, 'node/LICENSE'), 'Node licenses');
    write(
      join(work, 'node/VERIFIED'),
      hash(join(work, 'node/source.tar.xz')) + '  source.tar.xz',
    );
    const row = {
      name: 'fixture',
      version: '1',
      license: 'MIT',
      location: 'node_modules/fixture',
      integrity: 'sha512-fixture',
      notice_files: 1,
    };
    write(join(work, 'licenses/npm/INVENTORY.json'), JSON.stringify([row]));
    write(
      join(work, 'npm/package-lock.json'),
      JSON.stringify({
        packages: {
          '': {},
          'node_modules/fixture': { version: '1', integrity: 'sha512-fixture' },
        },
      }),
    );
    write(join(work, 'npm/node_modules/fixture/package.json'), '{}');
    write(
      join(work, 'licenses/npm/node_modules/fixture/LICENSE'),
      'MIT fixture',
    );
    assert.match(renderLegal(work), /Production npm dependencies/);
    write(join(work, 'licenses/npm/INVENTORY.json'), '[]');
    assert.throws(() => renderLegal(work), /inventory incomplete/);
    write(
      join(work, 'licenses/npm/INVENTORY.json'),
      JSON.stringify([{ ...row, integrity: 'changed' }]),
    );
    assert.throws(() => renderLegal(work), /provenance mismatch/);
    write(join(work, 'licenses/npm/INVENTORY.json'), JSON.stringify([row]));
    write(join(work, 'node/source.tar.xz'), 'changed');
    assert.throws(() => renderLegal(work), /checksum mismatch/);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
