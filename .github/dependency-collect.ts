// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { json, object, read, string } from '../scripts/lib.ts';
import { coverage, decodePolicy, gitDate } from './dependency-policy.ts';
import type { Dependency } from './dependency-types.ts';
type Add = (
  section: string,
  ecosystem: string,
  file: string,
  name: string,
  version: string,
  needle?: string | readonly string[],
  note?: string,
) => void;
const collectNpm = (
  root: string,
  config: import('./dependency-types.ts').Policy,
  add: Add,
): void => {
  const pkg = json(join(root, 'package.json')),
    lock = object(json(join(root, 'package-lock.json')).packages);
  for (const [location, value] of Object.entries(lock)) {
    if (!location) continue;
    const entry = object(value),
      name = location.split('node_modules/').at(-1);
    if (!name) throw new Error('Invalid npm location');
    const direct =
        Object.hasOwn(object(pkg.dependencies), name) ||
        Object.hasOwn(object(pkg.devDependencies), name),
      version = string(entry.version);
    add(
      entry.dev ? 'Development npm' : 'Runtime npm',
      'npm',
      direct ? 'package.json' : 'package-lock.json',
      name + (direct ? ' (direct)' : ' (transitive)'),
      version,
      direct
        ? '"' + name + '":'
        : ['"' + location + '":', '"version": "' + version + '"'],
      direct
        ? undefined
        : coverage(config, 'npm', 'package-lock.json', name) +
            '; lockfile/parent constraints apply',
    );
  }
};
const collectActions = (root: string, add: Add): void => {
  const actions = new Set<string>();
  for (const name of readdirSync(join(root, '.github/workflows'))
    .filter((file) => /\.ya?ml$/.test(file))
    .sort()) {
    const file = '.github/workflows/' + name;
    for (const match of read(join(root, file)).matchAll(
      /uses:\s*([\w./-]+)@([a-f0-9]{40})\s*#\s*(v[\w.-]+)/g,
    )) {
      const [, action, sha, version] = match;
      if (!action || !sha || !version || actions.has(action + '@' + sha))
        continue;
      actions.add(action + '@' + sha);
      add(
        'GitHub Actions',
        'github-actions',
        file,
        action,
        version + ' (' + sha.slice(0, 12) + '…)',
        action + '@' + sha,
      );
    }
  }
};
export const collect = (root: string): Dependency[] => {
  const config = decodePolicy(
    parse(read(join(root, '.github/dependabot.yml'))),
  );
  const rows: Dependency[] = [];
  const add = (
    section: string,
    ecosystem: string,
    file: string,
    name: string,
    version: string,
    needle: string | readonly string[] = version,
    note?: string,
  ): void => {
    rows.push({
      section,
      name,
      version,
      file,
      updated: gitDate(root, file, needle),
      coverage: note || coverage(config, ecosystem, file, name),
    });
  };
  for (const file of [
    'image/Dockerfile',
    '.github/scanner/Dockerfile',
    'tests/integration/ca/Dockerfile',
    'release/Source.Dockerfile',
  ]) {
    const seen = new Set<string>();
    for (const match of read(join(root, file)).matchAll(
      /^FROM\s+(?:--platform=\S+\s+)?([^\s]+).*$/gm,
    )) {
      const pin = match[1];
      if (!pin || !pin.includes(':') || seen.has(pin)) continue;
      seen.add(pin);
      const [image, digest] = pin.split('@');
      if (!image) continue;
      const colon = image.lastIndexOf(':');
      add(
        'Images',
        'docker',
        file,
        image.slice(0, colon),
        image.slice(colon + 1) +
          (digest ? ' (' + digest.slice(0, 19) + '…)' : ''),
        pin,
      );
    }
  }
  for (const name of readdirSync(join(root, 'examples'))
    .filter((file) => /^compose\..*\.yaml$/.test(file))
    .sort()) {
    const file = 'examples/' + name,
      document = object(parse(read(join(root, file))));
    for (const service of Object.values(object(document.services))) {
      const pin = string(object(service).image),
        [image, digest] = pin.split('@');
      if (!image) throw new Error('Invalid image');
      const colon = image.lastIndexOf(':');
      add(
        'Example images',
        'docker-compose',
        file,
        image.slice(0, colon),
        image.slice(colon + 1) +
          (digest ? ' (' + digest.slice(0, 19) + '…)' : ''),
        pin,
      );
    }
  }
  collectNpm(root, config, add);
  collectActions(root, add);
  const node = read(join(root, '.node-version')).trim();
  add(
    'Toolchain',
    'manual',
    '.node-version',
    'Node.js major',
    node,
    node,
    'Manual major upgrades; setup-node resolves patches within this major',
  );
  return rows;
};
