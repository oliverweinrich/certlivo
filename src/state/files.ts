// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';

export const errorCode = (error: unknown): string =>
  error instanceof Error && 'code' in error && typeof error.code === 'string'
    ? error.code
    : '';
export const readOptional = async (path: string): Promise<string | null> => {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return null;
    throw error;
  }
};
export const atomicWrite = async (
  path: string,
  content: string,
): Promise<void> => {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = path + '.' + randomUUID() + '.tmp';
  await writeFile(temporary, content, { mode: 0o600, flag: 'wx' });
  await rename(temporary, path);
};
export const prepareState = async (
  data: string,
  environment: string,
  directory: string,
): Promise<string> => {
  const root = join(data, 'node-acme', environment);
  const identity = join(root, 'directory-url');
  const old = await readOptional(identity);
  const legacy = await readOptional(
    join(data, 'acme', environment, 'directory-url'),
  );
  if ((old && old !== directory) || (legacy && legacy !== directory))
    throw new Error('ACME directory changed; use separate data');
  await atomicWrite(identity, directory);
  return root;
};
export const within = (root: string, path: string): boolean =>
  resolve(path).startsWith(resolve(root) + sep);
