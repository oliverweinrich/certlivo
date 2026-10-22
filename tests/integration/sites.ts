// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { write } from '../../scripts/lib.ts';
export const prepareSites = (fixtures: string): void => {
  for (const name of ['website', 'docs']) {
    const directory = join(fixtures, 'sites', name);
    write(join(directory, 'index.html'), `<h1>${name}</h1>`);
    write(join(directory, 'style.css'), 'body { color: green; }');
    write(join(directory, '.secret'), 'private fixture');
    mkdirSync(join(directory, 'empty'));
    write(join(directory, 'nested/index.html'), 'nested page');
    symlinkSync('/fixtures/private.txt', join(directory, 'escape.txt'));
    symlinkSync('/fixtures', join(directory, 'escape-dir'));
  }
  write(join(fixtures, 'private.txt'), 'must never be served');
};
