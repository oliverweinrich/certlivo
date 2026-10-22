// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  lstatSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export type Result = Readonly<{
  status: number;
  stdout: string;
  stderr: string;
}>;
export type Options = Readonly<{
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  input?: string | Buffer;
  allowFailure?: boolean;
  timeout?: number;
  live?: boolean;
}>;
export const run = (
  command: string,
  args: readonly string[],
  options: Options = {},
): Result => {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    env: options.env || process.env,
    ...(options.input === undefined ? {} : { input: options.input }),
    encoding: 'utf8',
    timeout: options.timeout || 360000,
    maxBuffer: 64 * 1024 * 1024,
    ...(options.live ? { stdio: 'inherit' } : {}),
  });
  const stderr = result.stderr || '';
  if (!options.allowFailure && (result.error || result.status !== 0))
    throw new Error(
      command +
        ' failed: ' +
        (result.error?.message || stderr.slice(-4000) || String(result.status)),
    );
  return {
    status: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
};
export const read = (file: string): string => readFileSync(file, 'utf8');
export const write = (file: string, value: string | Buffer): void => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, value);
};
export const files = (directory: string): string[] => {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .flatMap((name) => {
      const file = join(directory, name);
      const info = lstatSync(file);
      return info.isSymbolicLink()
        ? []
        : info.isDirectory()
          ? files(file)
          : [file];
    })
    .sort();
};
export const hash = (file: string): string =>
  createHash('sha256').update(readFileSync(file)).digest('hex');
export const equalFiles = (a: string, b: string): void => {
  if (!readFileSync(a).equals(readFileSync(b)))
    throw new Error('Files differ: ' + a + ' / ' + b);
};
export const object = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Expected JSON object');
  return input as Record<string, unknown>;
};
export const string = (input: unknown): string => {
  if (typeof input !== 'string') throw new Error('Expected string');
  return input;
};
export const array = (input: unknown): unknown[] => {
  if (!Array.isArray(input)) throw new Error('Expected array');
  return input;
};
export const json = (file: string): Record<string, unknown> =>
  object(JSON.parse(read(file)));
export const out = (value: string): void => {
  process.stdout.write(value + '\n');
};
export const isMain = (url: string): boolean =>
  !!process.argv[1] && resolve(process.argv[1]) === fileURLToPath(url);
export const cli = async (
  action: () => void | Promise<void>,
): Promise<void> => {
  try {
    await action();
  } catch (error) {
    process.stderr.write(
      (error instanceof Error ? error.message : 'Operation failed') + '\n',
    );
    process.exitCode = 1;
  }
};
