// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cli, isMain, out, root } from '../../scripts/lib.ts';
import {
  docker,
  image,
  probe,
  ready,
  startGateway,
  waitFor,
} from './docker-helpers.ts';
import { prepareSites } from './sites.ts';
import { generateCA } from './generate-ca.ts';
import { exerciseAcme } from './acme.ts';
export const integration = async (): Promise<void> => {
  const prefix = 'certlivo-test-' + String(process.pid),
    network = prefix + '-net',
    backend = prefix + '-api',
    plain = prefix + '-http',
    secure = prefix + '-tls',
    ca = prefix + '-ca',
    volume = prefix + '-data';
  const names = [backend, plain, secure, ca, secure + '-ephemeral'];
  const fixtures = mkdtempSync(join(tmpdir(), prefix + '-'));
  chmodSync(fixtures, 0o755);
  prepareSites(fixtures);
  try {
    await generateCA(fixtures);
    docker(['network', 'create', network]);
    docker(['volume', 'create', volume]);
    const startBackend = (identity: string): void => {
      docker([
        'run',
        '-d',
        '--name',
        backend,
        '--network',
        network,
        '--network-alias',
        'api',
        '-e',
        'IDENTITY=' + identity,
        '-v',
        join(root, 'tests/integration') + ':/tests:ro',
        '--entrypoint',
        'node',
        image,
        '/tests/backend.ts',
      ]);
    };
    startBackend('one');
    const routes = [
      {
        host: 'plain.test',
        path: '/api',
        target: 'http://api:3000',
        tls: false,
      },
      {
        host: 'plain.test',
        path: '/',
        target: 'file:///sites/website',
        tls: false,
      },
      {
        host: 'plain.test',
        path: '/docs',
        target: 'file:///sites/docs',
        tls: false,
      },
    ];
    startGateway(plain, network, routes, fixtures);
    await waitFor(() => ready(plain));
    for (const file of ['probe.ts', 'probe-static.ts'])
      out(
        probe(plain, fixtures, ['/tests/' + file, 'http://plain.test']).stdout,
      );
    out(
      docker(['exec', plain, 'node', '/tests/probe-ws.ts', 'ws://plain.test'])
        .stdout,
    );
    docker(['rm', '-f', backend]);
    startBackend('two');
    await waitFor(
      () =>
        probe(plain, fixtures, ['/tests/recovery-probe.ts'], true).status === 0,
    );
    out('Docker DNS recovery passed');
    await exerciseAcme(secure, ca, network, fixtures, volume);
    assert.notEqual(
      docker(
        [
          'run',
          '--rm',
          '-e',
          'ROUTES_JSON=[{"host":"a.test","path":"/","target":"http://api:3000"}]',
          image,
        ],
        true,
      ).status,
      0,
    );
    out('Invalid config rejection passed');
  } catch (error) {
    for (const name of names) {
      const log = docker(['logs', '--tail', '15', name], true);
      if (log.status === 0)
        process.stderr.write(name + '\n' + log.stdout + log.stderr);
    }
    throw error;
  } finally {
    for (const name of names) docker(['rm', '-f', name], true);
    docker(['volume', 'rm', volume], true);
    docker(['network', 'rm', network], true);
    rmSync(fixtures, { recursive: true, force: true });
  }
};
if (isMain(import.meta.url)) await cli(integration);
