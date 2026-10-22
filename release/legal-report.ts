// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  array,
  files,
  hash,
  json,
  object,
  read,
  run,
  string,
  write,
} from '../scripts/lib.ts';
import { packageRows } from './inventory.ts';
import type { NpmRow } from './inventory.ts';
const npmRows = (output: string): NpmRow[] =>
  array(JSON.parse(read(join(output, 'licenses/npm/INVENTORY.json')))).map(
    (item) => {
      const row = object(item);
      if (typeof row.notice_files !== 'number' || row.notice_files < 1)
        throw new Error('Missing npm notices');
      return {
        name: string(row.name),
        version: string(row.version),
        license: string(row.license),
        location: string(row.location),
        integrity: string(row.integrity),
        notice_files: row.notice_files,
      };
    },
  );
const validateNpm = (output: string): NpmRow[] => {
  const npm = npmRows(output),
    lock = object(json(join(output, 'npm/package-lock.json')).packages);
  const expected = Object.entries(lock)
    .filter(([key, entry]) => key && !object(entry).dev)
    .map(([key]) => key)
    .sort();
  if (
    JSON.stringify(expected) !==
    JSON.stringify(npm.map((row) => row.location).sort())
  )
    throw new Error('npm inventory incomplete');
  for (const row of npm) {
    const entry = object(lock[row.location]);
    if (
      row.version !== entry.version ||
      row.integrity !== entry.integrity ||
      !row.license
    )
      throw new Error('npm provenance mismatch');
    if (
      !existsSync(join(output, 'npm', row.location, 'package.json')) ||
      !existsSync(join(output, 'licenses/npm', row.location))
    )
      throw new Error('Missing npm source/license evidence');
  }
  return npm;
};
export const renderLegal = (output: string): string => {
  const rows = packageRows(read(join(output, 'packages.tsv')));
  if (!rows.length) throw new Error('Empty runtime inventory');
  for (const row of rows) {
    if (['UNKNOWN', 'NOASSERTION'].includes(row.license))
      throw new Error('Unknown package license');
    const id = row.origin + '-' + row.commit,
      source = join(output, 'alpine', id);
    if (
      read(join(source, 'VERIFIED')).trim() !==
      `${row.origin}\t${row.version}\t${row.commit}`
    )
      throw new Error('Source marker mismatch');
    if (
      !files(join(source, 'recipe')).some((file) => file.endsWith('/APKBUILD'))
    )
      throw new Error('Missing source recipe');
    if (
      !readdirSync(join(source, 'sources')).length &&
      /https?:/.test(read(join(source, 'source-definition-aarch64.txt')))
    )
      throw new Error('Missing downloaded sources');
    for (const name of ['source-notices.tar.gz', 'raw-source-notices.tar.gz']) {
      const result = run('tar', [
        '-tzf',
        join(output, 'licenses/alpine', id, name),
      ]);
      if (name === 'source-notices.tar.gz' && !result.stdout.trim())
        throw new Error('Empty source notices');
    }
  }
  const node = read(join(output, 'node/VERSION')).trim();
  const [digest, archive] = read(join(output, 'node/VERIFIED'))
    .trim()
    .split(/\s+/);
  if (!archive || !digest || hash(join(output, 'node', archive)) !== digest)
    throw new Error('Node source checksum mismatch');
  if (!existsSync(join(output, 'node/LICENSE')))
    throw new Error('Missing Node notices');
  const npm = validateNpm(output);
  const groups = new Map<string, Set<string>>();
  for (const row of rows) {
    const key = [
      row.package,
      row.version,
      row.license,
      row.origin + ' / `' + row.commit + '`',
    ].join(' | ');
    const arches = groups.get(key) || new Set<string>();
    arches.add(row.architecture);
    groups.set(key, arches);
  }
  return [
    '# Dependency licenses',
    '',
    'Generated from the prepared runtime inventory. This is a technical coverage',
    'report, not a legal opinion. Re-run release preparation after package changes.',
    '',
    `${groups.size} package/version records; ${new Set(rows.map((row) => row.origin + '-' + row.commit)).size} source origins; both target architectures.`,
    '',
    'Matching verified recipes, patches, upstream archives and complete copyright/license',
    'evidence accompany the release and image. Sources are published before executables.',
    '',
    '| Package | Version | License expression | Origin / build commit | Architecture |',
    '| --- | --- | --- | --- | --- |',
    ...[...groups]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([key, arches]) =>
          '| ' + key + ' | ' + [...arches].sort().join(', ') + ' |',
      ),
    '',
    '## Node.js runtime',
    '',
    `Node.js ${node}: checksum-verified complete upstream sources and bundled notices.`,
    'The Node notices are also shipped as node-LICENSE.txt.',
    '',
    '## Production npm dependencies',
    '',
    'Complete installed JavaScript sources, retained licenses and lockfile provenance',
    'accompany the release. Development dependencies are excluded from the runtime.',
    '',
    '| Package | Version | License |',
    '| --- | --- | --- |',
    ...npm.map((row) => `| ${row.name} | ${row.version} | ${row.license} |`),
    '',
    'Certlivo own files are Apache-2.0. Third-party files retain their licenses.',
    'The source helper, scanner and test CA are build/test tools, not runtime components.',
    '',
  ].join('\n');
};
export const legalReport = (output: string, root: string): void => {
  const text = renderLegal(output);
  write(join(root, 'docs/DEPENDENCY_LICENSES.md'), text);
};
