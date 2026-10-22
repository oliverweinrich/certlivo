// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { posix } from 'node:path';
import { array, object, read, run, string } from '../scripts/lib.ts';
import type { Policy } from './dependency-types.ts';
export const decodePolicy = (value: unknown): Policy => ({
  updates: array(object(value).updates).map((item) => {
    const row = object(item);
    const ignore = row.ignore
      ? array(row.ignore).map((entry) => {
          const rule = object(entry);
          return {
            'dependency-name': string(rule['dependency-name']),
            ...(rule['update-types']
              ? { 'update-types': array(rule['update-types']).map(string) }
              : {}),
            ...(rule.versions
              ? { versions: array(rule.versions).map(string) }
              : {}),
          };
        })
      : undefined;
    return {
      'package-ecosystem': string(row['package-ecosystem']),
      schedule: { interval: string(object(row.schedule).interval) },
      ...(row.directory ? { directory: string(row.directory) } : {}),
      ...(row.directories
        ? { directories: array(row.directories).map(string) }
        : {}),
      ...(ignore ? { ignore } : {}),
    };
  }),
});
export const coverage = (
  config: Policy,
  ecosystem: string,
  file: string,
  name: string,
): string => {
  const directory = posix.dirname('/' + file);
  const entry = config.updates.find(
    (item) =>
      item['package-ecosystem'] === ecosystem &&
      (item.directories || [item.directory]).includes(
        ecosystem === 'github-actions' ? '/' : directory,
      ),
  );
  if (!entry) return 'Not configured';
  if (
    entry.ignore?.some(
      (item) =>
        item['dependency-name'] === name &&
        !item['update-types'] &&
        !item.versions,
    )
  )
    return 'Excluded; release-managed';
  return `Yes (${ecosystem}; ${entry.schedule.interval})`;
};
export const gitDate = (
  root: string,
  file: string,
  needle: string | readonly string[],
): string => {
  const lines = read(root + '/' + file).split('\n');
  let index = -1;
  for (const part of typeof needle === 'string' ? [needle] : needle)
    index = lines.findIndex((line, i) => i > index && line.includes(part));
  if (index < 0) return 'Unknown';
  const result = run(
    'git',
    [
      'blame',
      '--line-porcelain',
      '-L',
      `${index + 1},${index + 1}`,
      '--',
      file,
    ],
    { cwd: root, allowFailure: true },
  );
  if (result.status) return 'Unknown (no Git history)';
  if (/^0{40} /.test(result.stdout)) return 'Uncommitted';
  const time = /^committer-time (\d+)$/m.exec(result.stdout)?.[1];
  return time
    ? new Date(Number(time) * 1000).toISOString().slice(0, 10)
    : 'Unknown';
};
