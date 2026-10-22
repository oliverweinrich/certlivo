// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { copyFileSync, cpSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { cli, files, isMain, root } from './lib.ts';
export const stageLegal = (
  source = root,
  destination = join(source, 'build/legal'),
): void => {
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  cpSync(join(source, 'licenses/third-party'), destination, {
    recursive: true,
  });
  for (const [input, output] of [
    ['LICENSE', 'APACHE-2.0.txt'],
    ['NOTICE', 'NOTICE'],
    ['THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_NOTICES.md'],
    ['docs/DEPENDENCY_LICENSES.md', 'COMPONENTS.md'],
  ])
    if (input && output)
      copyFileSync(join(source, input), join(destination, output));
  const generated = join(source, 'licenses/generated');
  for (const file of files(generated)) {
    if (file.endsWith('/.gitkeep')) continue;
    cpSync(file, join(destination, file.slice(generated.length + 1)), {
      recursive: true,
    });
  }
};
if (isMain(import.meta.url)) await cli(stageLegal);
