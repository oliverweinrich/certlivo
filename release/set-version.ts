// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  cli,
  isMain,
  json,
  object,
  out,
  read,
  root,
  write,
} from '../scripts/lib.ts';
import { stableVersion } from './context.ts';
export const setVersion = (next: string, directory = root): void => {
  stableVersion(next);
  const old = stableVersion(read(join(directory, 'VERSION')).trim());
  if (next === old) return;
  const manifest = json(join(directory, 'package.json')),
    lock = json(join(directory, 'package-lock.json'));
  const packages = object(lock.packages);
  const main = object(packages['']);
  manifest.version = next;
  lock.version = next;
  main.version = next;
  write(
    join(directory, 'package.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );
  write(
    join(directory, 'package-lock.json'),
    JSON.stringify(lock, null, 2) + '\n',
  );
  const readme = join(directory, 'README.md');
  write(readme, read(readme).replaceAll(old, next));
  for (const file of readdirSync(join(directory, 'examples')).filter((name) =>
    /^compose\..*\.yaml$/.test(name),
  )) {
    const path = join(directory, 'examples', file);
    write(path, read(path).replaceAll('certlivo:' + old, 'certlivo:' + next));
  }
  write(join(directory, 'VERSION'), next + '\n');
  out(`Version ${old} -> ${next}`);
};
if (isMain(import.meta.url))
  await cli(() => {
    setVersion(process.argv[2] || '');
  });
