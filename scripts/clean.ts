// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { cli, isMain, out, root } from './lib.ts';
export const clean = (args: readonly string[]): void => {
  if (args.some((arg) => !['--releases', '--cache'].includes(arg)))
    throw new Error('Usage: clean [--releases] [--cache]');
  const paths = [
    'dist',
    '.test-dist',
    'reports',
    'build/legal',
    'licenses/generated/alpine',
    'licenses/generated/release.json',
  ];
  if (args.includes('--releases')) paths.push('release-output', 'candidate');
  if (args.includes('--cache')) paths.push('release-cache');
  for (const path of paths)
    rmSync(join(root, path), { recursive: true, force: true });
  out(
    'Removed generated project outputs' +
      (args.includes('--cache') ? ' and download caches' : ''),
  );
};
if (isMain(import.meta.url))
  await cli(() => {
    clean(process.argv.slice(2));
  });
