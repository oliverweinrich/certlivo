// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const walk = (directory: string): string[] =>
  readdirSync(directory).flatMap((name) => {
    const file = join(directory, name);
    return statSync(file).isDirectory() ? walk(file) : [file];
  });
const paths = [
  '/usr/local/bin/node',
  '/app/package.json',
  '/app/package-lock.json',
  '/usr/local/share/certlivo/inventory.ts',
  '/usr/local/share/certlivo/hash-runtime.ts',
  ...walk('/app/dist'),
  ...walk('/app/node_modules'),
].sort();
for (const file of paths)
  process.stdout.write(
    createHash('sha256').update(readFileSync(file)).digest('hex') +
      '  ' +
      file +
      '\n',
  );
