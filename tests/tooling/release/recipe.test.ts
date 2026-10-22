// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { run, write } from '../../../scripts/lib.ts';
import {
  normalizeRecipe,
  validRecipe,
  recipePath,
  fetchRecipe,
} from '../../../release/recipe.ts';
await test('exact recipe extraction retains patches and excludes unrelated recipes', async (): Promise<void> => {
  const work = mkdtempSync(join(tmpdir(), 'certlivo-recipe-'));
  try {
    for (const [path, text] of [
      ['aports-commit/main/fixture/APKBUILD', 'pkgname=fixture\npkgver=1\n'],
      ['aports-commit/main/fixture/fix.patch', 'fixture patch'],
      ['aports-commit/community/other/APKBUILD', 'unrelated'],
    ] as const)
      write(join(work, path), text);
    const input = join(work, 'input.tar.gz'),
      output = join(work, 'recipe.tar.gz');
    run('tar', ['-czf', input, '-C', work, 'aports-commit']);
    assert(await normalizeRecipe(input, output, 'fixture'));
    assert(validRecipe(output, 'fixture'));
    const listing = run('tar', ['-tzf', output]).stdout;
    assert.match(listing, /fix\.patch/);
    assert.doesNotMatch(listing, /other/);
    assert.equal(
      await normalizeRecipe(input, join(work, 'missing.tar.gz'), 'missing'),
      false,
    );
    assert.throws(
      () => recipePath('aports/main/fixture/../../escape', 'fixture'),
      /Unsafe/,
    );
    assert.equal(recipePath('aports/main/other/APKBUILD', 'fixture'), null);
    await assert.rejects(
      fetchRecipe('invalid/origin', 'invalid', output),
      /Invalid recipe provenance/,
    );
    // Corrupted caches are replaced via exact-commit official fallback URLs.
    write(output, 'corrupted cache');
    const urls: string[] = [];
    const fetchFixture = (url: string, target: string): void => {
      urls.push(url);
      if (url.includes('codeload.github.com')) throw new Error('Fixture 403');
      copyFileSync(input, target);
    };
    await fetchRecipe('fixture', 'a'.repeat(40), output, fetchFixture);
    assert.equal(urls.length, 2);
    assert(urls[1]?.includes('sha=' + 'a'.repeat(40)));
    assert(urls[1]?.includes('path=main/fixture'));
    assert(validRecipe(output, 'fixture'));
    await fetchRecipe('fixture', 'a'.repeat(40), output, () => {
      throw new Error('Cache must avoid network');
    });
    const missing = join(work, 'missing-recipe.tar.gz');
    await assert.rejects(
      fetchRecipe('absent', 'a'.repeat(40), missing, (_url, target) => {
        copyFileSync(input, target);
      }),
      /Cannot retrieve recipe/,
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
