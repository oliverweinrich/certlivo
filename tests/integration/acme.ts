// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { out, read, root, write } from '../../scripts/lib.ts';
import {
  docker,
  image,
  probe,
  ready,
  startGateway,
  waitFor,
} from './docker-helpers.ts';
const fingerprint = (name: string, fixtures: string): string =>
  probe(name, fixtures, ['/tests/fingerprint.ts']).stdout.trim();
export const exerciseAcme = async (
  secure: string,
  ca: string,
  network: string,
  fixtures: string,
  volume: string,
): Promise<void> => {
  const pin = read(join(root, 'tests/integration/ca/Dockerfile'))
    .split('FROM ')[1]
    ?.trim();
  if (!pin) throw new Error('Missing Pebble pin');
  docker([
    'run',
    '-d',
    '--name',
    ca,
    '--network',
    network,
    '--network-alias',
    'pebble',
    '-e',
    'PEBBLE_VA_NOSLEEP=1',
    '-e',
    'PEBBLE_WFE_NONCEREJECT=0',
    '-e',
    'PEBBLE_AUTHZREUSE=' + (process.env.CERTLIVO_TEST_AUTHZ_REUSE || '100'),
    '-v',
    fixtures + ':/fixtures:ro',
    pin,
    '-config',
    '/fixtures/pebble.json',
  ]);
  await waitFor(() => {
    const result = probe(ca, fixtures, ['/tests/get-root.ts'], true);
    if (result.status) return false;
    write(join(fixtures, 'issued-ca.pem'), result.stdout);
    return true;
  });
  const ephemeral = secure + '-ephemeral',
    ephemeralRoute = {
      host: 'ephemeral.test',
      path: '/api',
      target: 'http://api:3000',
      tls: true,
    };
  startGateway(ephemeral, network, [ephemeralRoute], fixtures, { acme: true });
  await waitFor(() => ready(ephemeral), 90);
  const old = docker([
    'exec',
    ephemeral,
    'node',
    '/tests/certificate-hash.ts',
  ]).stdout;
  docker(['rm', '-f', ephemeral]);
  startGateway(ephemeral, network, [ephemeralRoute], fixtures, { acme: true });
  await waitFor(() => ready(ephemeral), 90);
  assert.notEqual(
    docker(['exec', ephemeral, 'node', '/tests/certificate-hash.ts']).stdout,
    old,
  );
  docker(['rm', '-f', ephemeral]);
  out('Volume-free issuance and replacement passed');
  const routes = [
    { host: 'api.test', path: '/api', target: 'http://api:3000', tls: true },
    { host: 'api.test', path: '/', target: 'file:///sites/website', tls: true },
    {
      host: 'api.test',
      path: '/docs',
      target: 'file:///sites/docs',
      tls: true,
    },
  ];
  startGateway(secure, network, routes, fixtures, { volume, acme: true });
  await waitFor(() => ready(secure), 90);
  const first = fingerprint(secure, fixtures);
  for (const file of ['probe.ts', 'redirect-probe.ts', 'probe-static.ts'])
    out(
      probe(secure, fixtures, [
        '/tests/' + file,
        ...(file === 'redirect-probe.ts' ? [] : ['https://api.test']),
      ]).stdout,
    );
  out(
    docker([
      'exec',
      '-e',
      'NODE_EXTRA_CA_CERTS=/fixtures/issued-ca.pem',
      secure,
      'node',
      '/tests/probe-ws.ts',
      'wss://api.test',
    ]).stdout,
  );
  docker(['exec', secure, 'certlivo', 'renew']);
  await waitFor(() => fingerprint(secure, fixtures) !== first);
  const second = fingerprint(secure, fixtures);
  out('HTTP-01, HTTPS and certificate renewal passed');
  docker(['rm', '-f', secure]);
  docker([
    'run',
    '--rm',
    '-v',
    volume + ':/data',
    '-v',
    join(root, 'tests/integration') + ':/tests:ro',
    '--entrypoint',
    'node',
    image,
    '/tests/legacy-fixture.ts',
  ]);
  startGateway(secure, network, routes, fixtures, { volume, acme: true });
  await waitFor(() => ready(secure));
  assert.equal(fingerprint(secure, fixtures), second);
  out('Validated certificate migration passed');
  const conflict = docker(
    [
      'run',
      '--rm',
      '-v',
      volume + ':/data',
      '-e',
      'ROUTES_JSON=[{"host":"other.test","path":"/","target":"http://api:3000","tls":false}]',
      image,
    ],
    true,
  );
  assert.notEqual(conflict.status, 0);
  assert.match(conflict.stderr, /already in use/);
  out('Exclusive state ownership passed');
  docker(['stop', ca]);
  docker(['restart', secure]);
  await waitFor(() => ready(secure));
  assert.equal(fingerprint(secure, fixtures), second);
  out('HTTPS survives CA outage');
  docker(['stop', '--time', '15', secure]);
  assert.equal(
    docker([
      'inspect',
      '--format',
      '{{.State.ExitCode}}',
      secure,
    ]).stdout.trim(),
    '0',
  );
  out('Graceful shutdown passed');
};
