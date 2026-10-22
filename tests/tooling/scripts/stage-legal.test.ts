// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stageLegal } from '../../../scripts/stage-legal.ts';
import { packageProject } from '../../../release/package-project.ts';
import { read, write, root, files } from '../../../scripts/lib.ts';
await test('legal assembly uses canonical notices, retains release evidence and replaces stale output', (): void => {
  const directory = mkdtempSync(join(tmpdir(), 'certlivo-legal-stage-'));
  try {
    for (const file of [
      'LICENSE',
      'NOTICE',
      'THIRD_PARTY_NOTICES.md',
      'docs/DEPENDENCY_LICENSES.md',
    ])
      write(join(directory, file), file + '\n');
    write(join(directory, 'licenses/third-party/upstream.txt'), 'upstream');
    write(join(directory, 'licenses/generated/.gitkeep'), '');
    stageLegal(directory);
    const target = join(directory, 'build/legal');
    assert.equal(read(join(target, 'APACHE-2.0.txt')), 'LICENSE\n');
    assert.equal(
      read(join(target, 'COMPONENTS.md')),
      'docs/DEPENDENCY_LICENSES.md\n',
    );
    assert.equal(read(join(target, 'upstream.txt')), 'upstream');
    assert(!existsSync(join(target, '.gitkeep')));
    write(join(target, 'obsolete'), 'stale');
    write(
      join(directory, 'licenses/generated/alpine/fixture/COPYING'),
      'retained',
    );
    stageLegal(directory);
    assert(!existsSync(join(target, 'obsolete')));
    assert.equal(read(join(target, 'alpine/fixture/COPYING')), 'retained');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

await test('release source snapshot retains every legal and test input needed to reconstruct image notices', (): void => {
  const directory = mkdtempSync(join(tmpdir(), 'certlivo-project-snapshot-'));
  try {
    const project = join(directory, 'project');
    packageProject(root, project);
    for (const path of [
      'tsconfig.tests.json',
      'tests/unit/state/files.test.ts',
      'tests/tooling/release/test-permissions.ts',
      'licenses/generated/.gitkeep',
    ])
      assert(existsSync(join(project, path)), 'Missing source input: ' + path);
    write(
      join(project, 'licenses/generated/alpine/fixture/COPYING'),
      'extensionless notice',
    );
    write(
      join(project, 'licenses/generated/alpine/fixture/source-notices.tar.gz'),
      'archive fixture',
    );
    const repackaged = join(directory, 'repackaged');
    packageProject(project, repackaged);
    stageLegal(repackaged);
    assert.equal(
      read(join(repackaged, 'build/legal/alpine/fixture/COPYING')),
      'extensionless notice',
    );
    assert.equal(
      read(
        join(repackaged, 'build/legal/alpine/fixture/source-notices.tar.gz'),
      ),
      'archive fixture',
    );
    stageLegal(project);
    const actual = join(project, 'build/legal');
    for (const file of files(join(root, 'licenses/third-party')))
      assert.equal(
        read(join(actual, file.split('/').at(-1) || '')),
        read(file),
      );
    assert.equal(read(join(actual, 'NOTICE')), read(join(root, 'NOTICE')));
    assert(!existsSync(join(project, 'image/legal')));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
