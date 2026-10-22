// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { equalFiles, hash, read, run, write, out } from '../scripts/lib.ts';
import { download } from './download.ts';
export const collectNode = (output: string, cache: string): void => {
  const version = read(join(output, 'seed/linux_amd64/node-version')).trim();
  if (
    !/^v\d+\.\d+\.\d+$/.test(version) ||
    version !== read(join(output, 'seed/linux_arm64/node-version')).trim()
  )
    throw new Error('Invalid or inconsistent Node versions');
  const directory = join(cache, 'node', version),
    destination = join(output, 'node'),
    filename = `node-${version}.tar.xz`;
  mkdirSync(directory, { recursive: true });
  mkdirSync(destination, { recursive: true });
  download(
    `https://nodejs.org/dist/${version}/SHASUMS256.txt`,
    join(directory, 'SHASUMS256.txt'),
  );
  const matches = read(join(directory, 'SHASUMS256.txt'))
    .split('\n')
    .map((line) => line.trim().split(/\s+/))
    .filter((parts) => parts[1] === filename);
  const expected = matches[0]?.[0];
  if (matches.length !== 1 || !expected || !/^[a-f0-9]{64}$/.test(expected))
    throw new Error('Missing authoritative Node source checksum');
  download(
    `https://nodejs.org/dist/${version}/${filename}`,
    join(directory, filename),
  );
  if (hash(join(directory, filename)) !== expected)
    throw new Error('Node source checksum mismatch');
  for (const file of [filename, 'SHASUMS256.txt'])
    copyFileSync(join(directory, file), join(destination, file));
  write(
    join(destination, 'LICENSE'),
    run('tar', ['-xOf', join(destination, filename), `node-${version}/LICENSE`])
      .stdout,
  );
  write(join(destination, 'VERSION'), version + '\n');
  for (const arch of ['amd64', 'arm64'])
    equalFiles(
      join(destination, 'LICENSE'),
      join(output, `seed/linux_${arch}/licenses/node-LICENSE.txt`),
    );
  if (!readFileSync(join(destination, 'LICENSE')).length)
    throw new Error('Empty Node license');
  write(join(destination, 'VERIFIED'), `${expected}  ${filename}\n`);
  out('Verified Node source: ' + version);
};
