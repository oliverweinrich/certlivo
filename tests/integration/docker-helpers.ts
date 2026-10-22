// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { root, read, run } from '../../scripts/lib.ts';
import type { Result } from '../../scripts/lib.ts';
export const image =
  process.env.CERTLIVO_TEST_IMAGE ||
  'certlivo:' + read(join(root, 'VERSION')).trim();
export type FixtureRoute = Readonly<{
  host: string;
  path: string;
  target: string;
  tls: boolean;
}>;
export const docker = (args: readonly string[], allowFailure = false): Result =>
  run('docker', args, { allowFailure });
export const waitFor = async (
  check: () => boolean | Promise<boolean>,
  seconds = 60,
): Promise<void> => {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await setTimeout(1000);
  }
  throw new Error('Timed out waiting for test condition');
};
export const ready = (name: string): boolean =>
  docker(['exec', name, 'certlivo', 'healthcheck'], true).status === 0;
export const startGateway = (
  name: string,
  network: string,
  routes: readonly FixtureRoute[],
  fixtures: string,
  options: Readonly<{ volume?: string; acme?: boolean }> = {},
): void => {
  const args = [
    'run',
    '-d',
    '--name',
    name,
    '--network',
    network,
    '-v',
    join(root, 'tests/integration') + ':/tests:ro',
    '-v',
    fixtures + ':/fixtures:ro',
    '-v',
    join(fixtures, 'sites') + ':/sites:ro',
    '-e',
    'MAX_BODY_SIZE=1m',
    '-e',
    'ROUTES_JSON=' + JSON.stringify(routes),
  ];
  for (const host of new Set(routes.map((route) => route.host)))
    args.push('--network-alias', host);
  if (options.volume) args.push('-v', options.volume + ':/data');
  if (options.acme)
    args.push(
      '-e',
      'ACME_EMAIL=admin@example.test',
      '-e',
      'ACME_AGREE_TOS=true',
      '-e',
      'ACME_ENV=staging',
      '-e',
      'ACME_DIRECTORY_URL=https://pebble:14000/dir',
      '-e',
      'NODE_EXTRA_CA_CERTS=/fixtures/ca.pem',
    );
  docker([...args, image]);
};
export const probe = (
  name: string,
  fixtures: string,
  args: readonly string[],
  allowFailure = false,
): Result =>
  docker(
    [
      'run',
      '--rm',
      '--network',
      'container:' + name,
      '-v',
      join(root, 'tests/integration') + ':/tests:ro',
      '-v',
      fixtures + ':/fixtures:ro',
      '--entrypoint',
      'node',
      image,
      ...args,
    ],
    allowFailure,
  );
