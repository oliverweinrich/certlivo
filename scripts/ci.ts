// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { readVersion } from '../release/context.ts';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { cli, root, run } from './lib.ts';
import { comparePackages, helperInventory } from './ci-packages.ts';
import {
  buildCandidate,
  candidateSbom,
  exportCandidate,
  finishCandidate,
  loadCandidate,
  releaseRef,
  scanCandidate,
} from './ci-candidate.ts';
const validate = (): void => {
  readVersion();
  for (const name of ['format:check', 'lint', 'typecheck', 'test'])
    run('npm', ['run', name], { live: true });
  run('npm', ['audit', '--audit-level=high'], { live: true });
};
const host = (): void => {
  mkdirSync(join(root, 'reports'), { recursive: true });
  run('npm', ['run', 'dockerhub:preview'], { live: true });
};
const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error('Set ' + name);
  return value;
};
const login = (): void => {
  run(
    'docker',
    ['login', '--username', required('DOCKERHUB_USERNAME'), '--password-stdin'],
    { input: required('DOCKERHUB_TOKEN') },
  );
};
const actions: Readonly<Record<string, () => void | Promise<void>>> = {
  validate,
  host,
  'helper-inventory': () => {
    helperInventory(process.argv[3]);
  },
  'compare-packages': comparePackages,
  'release-ref': releaseRef,
  'build-candidate': buildCandidate,
  'scan-candidate': scanCandidate,
  'candidate-sbom': candidateSbom,
  'finish-candidate': finishCandidate,
  'export-candidate': exportCandidate,
  'load-candidate': () => {
    loadCandidate();
  },
  'restore-release': () => {
    loadCandidate(true);
  },
  'docker-login': login,
  'check-overview-token': () => {
    required('DOCKERHUB_OVERVIEW_TOKEN');
  },
};
await cli(() => {
  const action = actions[process.argv[2] || ''];
  if (!action) throw new Error('Unknown CI command');
  return action();
});
