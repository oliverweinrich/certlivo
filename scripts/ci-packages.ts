// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { out, root, run, write } from './lib.ts';
export const helperInventory = (
  image = 'certlivo:source-helper-check',
): void => {
  write(
    join(root, 'reports/source-helper-packages.tsv'),
    run('docker', [
      'run',
      '--rm',
      '--network',
      'none',
      '--entrypoint',
      'node',
      '-v',
      join(root, 'scripts') + ':/inventory:ro',
      image,
      '/inventory/inventory.ts',
    ]).stdout,
  );
};
export const comparePackages = async (): Promise<void> => {
  const candidate = run('docker', [
    'run',
    '--rm',
    '--network',
    'none',
    '--entrypoint',
    'cat',
    'certlivo:ci',
    '/usr/share/licenses/certlivo/packages.tsv',
  ]).stdout;
  const response = await fetch(
    'https://hub.docker.com/v2/repositories/oliverweinrich/certlivo/tags/latest/',
    { redirect: 'error', signal: AbortSignal.timeout(30000) },
  );
  let published = candidate;
  if (response.status === 200) {
    run('docker', ['pull', 'oliverweinrich/certlivo:latest'], { live: true });
    published = run('docker', [
      'run',
      '--rm',
      '--network',
      'none',
      '--entrypoint',
      'cat',
      'oliverweinrich/certlivo:latest',
      '/usr/share/licenses/certlivo/packages.tsv',
    ]).stdout;
  } else if (response.status !== 404)
    throw new Error('Cannot inspect published tag: ' + String(response.status));
  const current = join(root, 'reports/packages-candidate.tsv'),
    previous = join(root, 'reports/packages-published.tsv');
  write(current, candidate);
  write(previous, published);
  const diff = run('diff', ['-u', previous, current], { allowFailure: true });
  if (diff.status > 1) throw new Error('Package comparison failed');
  write(join(root, 'reports/packages.diff'), diff.stdout);
  const summary = diff.stdout
    ? '### Package changes compared with latest\n```diff\n' +
      diff.stdout +
      '```\n'
    : 'Installed package inventory matches the published image.\n';
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  else out(summary);
};
