// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { cli, isMain, run } from '../../../scripts/lib.ts';
export const testPermissions = (image: string): void => {
  if (!image) throw new Error('Expected source-helper image');
  run(
    'docker',
    [
      'run',
      '--rm',
      '--network',
      'none',
      '--user',
      '0:0',
      '--entrypoint',
      'node',
      image,
      'tests/tooling/release/permissions-probe.ts',
    ],
    { live: true },
  );
};
if (isMain(import.meta.url))
  await cli(() => {
    testPermissions(process.argv[2] || '');
  });
