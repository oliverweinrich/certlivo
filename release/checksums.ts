// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { join, resolve, sep } from 'node:path';
import { hash, read, write } from '../scripts/lib.ts';
export const checksums = (
  directory: string,
  names: readonly string[],
): string =>
  names
    .map((name) => hash(join(directory, name)) + '  ' + name + '\n')
    .join('');
export const writeChecksums = (
  directory: string,
  names: readonly string[],
): void => {
  write(join(directory, 'SHA256SUMS'), checksums(directory, names));
};
export const verifyChecksums = (
  directory: string,
  manifest = 'SHA256SUMS',
): void => {
  const lines = read(join(directory, manifest)).trim().split('\n');
  if (!lines.length) throw new Error('Empty checksum manifest');
  for (const line of lines) {
    const match = /^([a-f0-9]{64}) {2}([^\n]+)$/.exec(line);
    if (!match?.[1] || !match[2]) throw new Error('Invalid checksum line');
    const file = resolve(directory, match[2]);
    if (!file.startsWith(resolve(directory) + sep) || hash(file) !== match[1])
      throw new Error('Checksum mismatch: ' + match[2]);
  }
};
