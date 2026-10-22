// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  array,
  cli,
  isMain,
  object,
  out,
  read,
  root,
  string,
  write,
} from '../scripts/lib.ts';
import { collect } from './dependency-collect.ts';
import { render, runtimeInventory } from './dependency-render.ts';
import type { Snapshot } from './dependency-types.ts';
export { collect } from './dependency-collect.ts';
export { coverage, gitDate } from './dependency-policy.ts';
export { render, runtimeInventory } from './dependency-render.ts';
const publishedInventory = async (): Promise<Snapshot> => {
  const response = await fetch(
    'https://api.github.com/repos/oliverweinrich/certlivo/releases/latest',
    { signal: AbortSignal.timeout(60000) },
  );
  if (!response.ok)
    throw new Error(
      'Published inventory lookup failed: ' + String(response.status),
    );
  const release = object(await response.json()),
    asset = array(release.assets)
      .map(object)
      .find((entry) => entry.name === 'packages.tsv');
  if (!asset) throw new Error('Missing published packages.tsv');
  const url = string(asset.browser_download_url);
  if (
    !url.startsWith(
      'https://github.com/oliverweinrich/certlivo/releases/download/',
    )
  )
    throw new Error('Unexpected inventory URL');
  const data = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!data.ok) throw new Error('Published inventory unavailable');
  return {
    tag: string(release.tag_name),
    date: string(release.published_at).slice(0, 10),
    url,
    packages: runtimeInventory(await data.text()),
  };
};
const main = async (): Promise<void> => {
  const args = process.argv.slice(2),
    offline =
      args.includes('--offline') ||
      ['ci', 'install'].includes(process.env.npm_command || '');
  const index = args.indexOf('--output'),
    target =
      index >= 0
        ? args[index + 1]
        : args.includes('--write')
          ? 'DEPENDENCIES.md'
          : null;
  if (index >= 0 && !target) throw new Error('--output requires a path');
  const helperFile = join(root, 'reports/source-helper-packages.tsv');
  const helper = existsSync(helperFile)
    ? {
        packages: runtimeInventory(read(helperFile)),
        observed: statSync(helperFile).mtime.toISOString().slice(0, 10),
      }
    : null;
  const text = render(
    collect(root),
    offline ? null : await publishedInventory(),
    helper,
  );
  if (target) {
    write(join(root, target), text);
    out('Dependency inventory written: ' + target);
  } else process.stdout.write(text);
};
if (isMain(import.meta.url)) await cli(main);
