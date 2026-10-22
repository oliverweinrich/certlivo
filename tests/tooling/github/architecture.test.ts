// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname, resolve, relative } from 'node:path';
import { files, read, root } from '../../../scripts/lib.ts';
await test('all TypeScript modules are bounded and acyclic', (): void => {
  const graph = new Map<string, string[]>();
  for (const directory of ['src', 'scripts', 'release', 'tests', '.github'])
    for (const file of files(join(root, directory)).filter((path) =>
      path.endsWith('.ts'),
    )) {
      const source = read(file);
      if (file.endsWith('.test.ts') || source.includes("from 'node:test'"))
        assert(
          file.startsWith(join(root, 'tests') + '/'),
          'Test outside tests/: ' + file,
        );
      assert(
        source.trimEnd().split('\n').length <= 200,
        'Split large module: ' + relative(root, file),
      );
      graph.set(
        file,
        [...source.matchAll(/(?:from\s+|import\s*)['"](\.[^'"]+)['"]/g)].map(
          (match) =>
            resolve(dirname(file), (match[1] || '').replace(/\.js$/, '.ts')),
        ),
      );
    }
  const complete = new Set<string>();
  const visit = (file: string, parents: readonly string[]): void => {
    assert(
      !parents.includes(file),
      'Import cycle: ' + [...parents, file].join(' -> '),
    );
    if (complete.has(file)) return;
    const dependencies = graph.get(file);
    assert(dependencies, 'Import does not resolve: ' + file);
    for (const dependency of dependencies)
      visit(dependency, [...parents, file]);
    complete.add(file);
  };
  for (const file of graph.keys()) visit(file, []);
});
await test('one central package manifest and no own Shell/Python scripts remain', (): void => {
  for (const directory of [
    'src',
    'scripts',
    'release',
    'tests',
    '.github',
    'image',
  ])
    for (const file of files(join(root, directory))) {
      if (file.includes('/legal/')) continue;
      assert(
        !/\.(sh|py|cjs)$/.test(file),
        'Obsolete script: ' + relative(root, file),
      );
      assert(
        !file.endsWith('/package.json'),
        'Nested package manifest: ' + file,
      );
    }
});
