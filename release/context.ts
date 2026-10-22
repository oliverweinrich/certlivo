// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { join, resolve } from 'node:path';
import { read, root, string, json, object } from '../scripts/lib.ts';
export const stableVersion = (value: string): string => {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value))
    throw new Error('Expected stable VERSION');
  return value;
};
export const readVersion = (directory = root): string => {
  const version = stableVersion(read(join(directory, 'VERSION')).trim());
  if (string(json(join(directory, 'package.json')).version) !== version)
    throw new Error('package.json version differs from VERSION');
  const lock = json(join(directory, 'package-lock.json'));
  if (
    lock.version !== version ||
    object(object(lock.packages)['']).version !== version
  )
    throw new Error('package-lock.json version differs from VERSION');
  return version;
};
export const context = (): Readonly<{
  root: string;
  version: string;
  output: string;
  cache: string;
  image: string;
}> => {
  const version = readVersion();
  return {
    root,
    version,
    output: resolve(
      process.env.CERTLIVO_RELEASE_DIR || join(root, 'release-output', version),
    ),
    cache: resolve(
      process.env.CERTLIVO_CACHE_DIR || join(root, 'release-cache'),
    ),
    image: process.env.CERTLIVO_TEST_IMAGE || 'certlivo:' + version,
  };
};
export const artifacts = (version: string): string[] => [
  `certlivo-${version}-sources.tar.gz`,
  `certlivo-${version}-licenses.tar.gz`,
  'packages.tsv',
  'npm-packages.json',
  'node-version',
  'SHA256SUMS',
  'sbom-amd64.spdx.json',
  'sbom-arm64.spdx.json',
];
