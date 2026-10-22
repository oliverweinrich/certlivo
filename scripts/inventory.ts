// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export const inventory = (database: string): string => {
  const keys = ['P', 'V', 'L', 'o', 'c', 'A'];
  const rows = database
    .split(/\n\s*\n/)
    .map((block) => {
      const fields = new Map(
        block.split('\n').map((line) => [line.slice(0, 1), line.slice(2)]),
      );
      return fields.get('P')
        ? keys.map((key) => fields.get(key) || '').join('\t')
        : '';
    })
    .filter(Boolean);
  return [
    'package\tversion\tlicense\torigin\tcommit\tarchitecture',
    ...rows,
  ].join('\n');
};
if (process.argv[1] === fileURLToPath(import.meta.url))
  process.stdout.write(
    inventory(
      readFileSync(process.argv[2] || '/lib/apk/db/installed', 'utf8'),
    ) + '\n',
  );
