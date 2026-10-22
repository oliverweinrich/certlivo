// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { constants } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { within } from '../state/index.js';

const forbidden = (): Error =>
  Object.assign(new Error('Static path is not public'), { code: 'EACCES' });
export const openPublicFile = async (
  directory: string,
  relative: string,
): Promise<FileHandle> => {
  if ((await realpath(directory)) !== directory) throw forbidden();
  const path = resolve(directory, relative);
  if (!within(directory, path)) throw forbidden();
  let current = directory;
  for (const part of path.slice(directory.length + 1).split(sep)) {
    current = join(current, part);
    if ((await lstat(current)).isSymbolicLink()) throw forbidden();
  }
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    // Linux descriptor validation closes the parent-directory replacement race.
    const opened =
      process.platform === 'linux' ? `/proc/self/fd/${file.fd}` : path;
    if ((await realpath(opened)) !== path) throw forbidden();
    if (!(await file.stat()).isFile()) throw forbidden();
    return file;
  } catch (error) {
    await file.close();
    throw error;
  }
};
export const publicPath = async (
  directory: string,
  relative: string,
): Promise<string> => {
  const path = resolve(directory, relative || '.');
  if (path !== directory && !within(directory, path)) throw forbidden();
  if ((await realpath(path)) !== path) throw forbidden();
  return path;
};
