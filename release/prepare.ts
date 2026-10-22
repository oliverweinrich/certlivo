// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  cli,
  equalFiles,
  isMain,
  out,
  read,
  run,
  write,
} from '../scripts/lib.ts';
import { context } from './context.ts';
import { collectNode } from './collect-node.ts';
import { legalReport } from './legal-report.ts';
import { stageLegal } from '../scripts/stage-legal.ts';
import { packageProject } from './package-project.ts';
import { writeChecksums } from './checksums.ts';
import { testPermissions } from '../tests/tooling/release/test-permissions.ts';
export const prepare = (): void => {
  const { root, version, output, cache } = context();
  if (existsSync(join(output, 'COMPLETE')))
    throw new Error(
      'Release already prepared; use a new version or separate output',
    );
  stageLegal(root);
  const refresh = process.env.CERTLIVO_REFRESH || '1';
  if (!['0', '1'].includes(refresh))
    throw new Error('CERTLIVO_REFRESH must be 0 or 1');
  mkdirSync(output, { recursive: true });
  mkdirSync(cache, { recursive: true });
  const fresh =
    refresh === '1' ? ['--pull', '--no-cache-filter', 'runtime'] : [];
  run(
    'docker',
    [
      'buildx',
      'build',
      ...fresh,
      '--platform',
      'linux/amd64,linux/arm64',
      '--build-arg',
      'VERSION=' + version,
      '--target',
      'release-sources',
      '--output',
      'type=local,dest=' + join(output, 'seed'),
      '-f',
      'image/Dockerfile',
      '.',
    ],
    { live: true, timeout: 1200000 },
  );
  write(
    join(output, 'packages.tsv'),
    read(join(output, 'seed/linux_amd64/packages.tsv')) +
      read(join(output, 'seed/linux_arm64/packages.tsv'))
        .split('\n')
        .slice(1)
        .join('\n'),
  );
  run(
    'docker',
    [
      'build',
      ...(refresh === '1' ? ['--pull', '--no-cache'] : []),
      '-t',
      'certlivo-source-helper:local',
      '-f',
      'release/Source.Dockerfile',
      '.',
    ],
    { live: true, timeout: 600000 },
  );
  testPermissions('certlivo-source-helper:local');
  run(
    'docker',
    [
      'run',
      '--rm',
      '--security-opt',
      'no-new-privileges:true',
      '-e',
      'CERTLIVO_OUTPUT_UID=' + String(process.getuid?.() || 0),
      '-e',
      'CERTLIVO_OUTPUT_GID=' + String(process.getgid?.() || 0),
      '-v',
      `${output}:/output`,
      '-v',
      `${cache}:/cache`,
      'certlivo-source-helper:local',
    ],
    { live: true, timeout: 1800000 },
  );
  equalFiles(
    join(output, 'seed/linux_amd64/licenses/npm/INVENTORY.json'),
    join(output, 'seed/linux_arm64/licenses/npm/INVENTORY.json'),
  );
  cpSync(join(output, 'seed/linux_amd64/npm'), join(output, 'npm'), {
    recursive: true,
  });
  cpSync(
    join(output, 'seed/linux_amd64/licenses/npm'),
    join(output, 'licenses/npm'),
    { recursive: true },
  );
  copyFileSync(
    join(output, 'licenses/npm/INVENTORY.json'),
    join(output, 'npm-packages.json'),
  );
  copyFileSync(
    join(output, 'seed/linux_amd64/node-version'),
    join(output, 'node-version'),
  );
  collectNode(output, cache);
  legalReport(output, root);
  cpSync(
    join(output, 'licenses/alpine'),
    join(root, 'licenses/generated/alpine'),
    {
      recursive: true,
    },
  );
  write(
    join(root, 'licenses/generated/release.json'),
    JSON.stringify({
      project: 'Certlivo',
      version,
      source_archive: `certlivo-${version}-sources.tar.gz`,
      distribution:
        'Publish matching sources before the runtime image; see THIRD_PARTY_NOTICES.md.',
    }) + '\n',
  );
  stageLegal(root);
  packageProject(root, join(output, 'project'));
  for (const arch of ['amd64', 'arm64'])
    for (const file of ['runtime-files.sha256', 'packages.tsv']) {
      const name =
        file === 'packages.tsv'
          ? `packages-${arch}.tsv`
          : `runtime-files-${arch}.sha256`;
      write(
        join(output, 'metadata', name),
        read(join(output, `seed/linux_${arch}`, file)),
      );
    }
  const source = `certlivo-${version}-sources.tar.gz`,
    license = `certlivo-${version}-licenses.tar.gz`;
  run(
    'tar',
    [
      '-czf',
      join(output, source),
      '-C',
      output,
      'project',
      'alpine',
      'node',
      'npm',
      'licenses',
      'metadata',
      'packages.tsv',
      'npm-packages.json',
      'node-version',
    ],
    { env: { ...process.env, COPYFILE_DISABLE: '1' }, timeout: 600000 },
  );
  cpSync(join(output, 'seed/linux_amd64/licenses'), join(output, 'licenses'), {
    recursive: true,
  });
  cpSync(join(root, 'build/legal'), join(output, 'licenses'), {
    recursive: true,
  });
  run('tar', ['-czf', join(output, license), '-C', output, 'licenses'], {
    env: { ...process.env, COPYFILE_DISABLE: '1' },
    timeout: 600000,
  });
  writeChecksums(output, [
    source,
    license,
    'packages.tsv',
    'npm-packages.json',
    'node-version',
  ]);
  write(
    join(output, 'COMPLETE'),
    'Matching sources collected and verified. Publish before runtime images.\n',
  );
  out('Release prepared: ' + output);
};
if (isMain(import.meta.url)) await cli(prepare);
