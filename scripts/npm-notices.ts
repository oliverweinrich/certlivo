// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, readFileSync, copyFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { files, json, object, string, write } from './lib.ts';
import type { NpmRow } from '../release/inventory.ts';
const [root, output] = process.argv.slice(2);
if (!root || !output)
  throw new Error('Expected application and notice directory');
const inventory: NpmRow[] = [];
for (const [location, value] of Object.entries(
  object(json(join(root, 'package-lock.json')).packages),
)) {
  if (!location) continue;
  const entry = object(value);
  if (entry.dev) continue;
  const directory = join(root, location),
    pkg = json(join(directory, 'package.json'));
  if (pkg.version !== entry.version || !entry.integrity || !pkg.license)
    throw new Error('Missing npm license/provenance: ' + location);
  let count = 0;
  for (const file of files(directory)) {
    if (file.endsWith('.node'))
      throw new Error('Native npm dependency requires separate source review');
    const name = relative(directory, file),
      named = /license|copying|copyright|notice/i.test(
        name.split('/').at(-1) || '',
      );
    const content = readFileSync(file);
    const header =
      /copyright|spdx-license-identifier|permission is hereby granted|redistribution and use/i.test(
        content.subarray(0, 16384).toString(),
      );
    if (named || header || name === 'package.json') {
      const target = join(output, location, name);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(file, target);
      if (named || header) count++;
    }
  }
  if (!count) throw new Error('Missing npm license evidence');
  inventory.push({
    name: string(pkg.name),
    version: string(pkg.version),
    license: string(pkg.license),
    location,
    integrity: string(entry.integrity),
    notice_files: count,
  });
}
write(
  join(output, 'INVENTORY.json'),
  JSON.stringify(
    inventory.sort((a, b) => a.name.localeCompare(b.name)),
    null,
    2,
  ) + '\n',
);
