// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { cpSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { context, artifacts } from '../release/context.ts';
import { check } from '../release/check.ts';
import {
  checksums,
  verifyChecksums,
  writeChecksums,
} from '../release/checksums.ts';
import { root, run, write } from './lib.ts';
import { scan } from './scan.ts';
import { sbom } from './sbom.ts';
export const releaseRef = (): void => {
  const { version } = context();
  run('git', ['merge-base', '--is-ancestor', 'HEAD', 'origin/main']);
  if (process.env.GITHUB_REF_TYPE === 'tag') {
    if (process.env.GITHUB_REF_NAME !== 'v' + version)
      throw new Error('Tag differs from VERSION');
  } else if (process.env.GITHUB_REF !== 'refs/heads/main')
    throw new Error('Manual releases require main');
};
export const buildCandidate = (): void => {
  const { version, image } = context();
  run(
    'docker',
    [
      'buildx',
      'build',
      '--platform',
      'linux/amd64,linux/arm64',
      '--load',
      '--build-arg',
      'VERSION=' + version,
      '-t',
      image,
      '-f',
      'image/Dockerfile',
      '.',
    ],
    { live: true, timeout: 1200000 },
  );
  check('--local');
};
export const scanCandidate = (): void => {
  const { image, output } = context();
  for (const arch of ['amd64', 'arm64'])
    scan(image, 'linux/' + arch, join(output, 'trivy-' + arch + '.json'));
};
export const candidateSbom = (): void => {
  const { image, output } = context();
  for (const arch of ['amd64', 'arm64'])
    sbom(image, 'linux/' + arch, join(output, 'sbom-' + arch + '.spdx.json'));
};
export const finishCandidate = (): void => {
  const { output, version } = context();
  writeChecksums(
    output,
    artifacts(version).filter((name) => name !== 'SHA256SUMS'),
  );
  check('--local');
};
export const exportCandidate = (): void => {
  const { image, output } = context(),
    directory = join(root, 'candidate');
  mkdirSync(directory, { recursive: true });
  run('docker', ['image', 'save', '-o', join(directory, 'image.tar'), image], {
    timeout: 600000,
  });
  write(
    join(directory, 'image.tar.sha256'),
    checksums(directory, ['image.tar']),
  );
  run(
    'tar',
    ['-czf', join(directory, 'release-state.tar.gz'), '-C', output, '.'],
    { timeout: 600000 },
  );
};
export const loadCandidate = (restoreState = false): void => {
  const { output, version } = context(),
    directory = join(root, 'candidate');
  verifyChecksums(directory, 'image.tar.sha256');
  run('docker', ['image', 'load', '-i', join(directory, 'image.tar')], {
    live: true,
    timeout: 600000,
  });
  if (restoreState) {
    mkdirSync(output, { recursive: true });
    run(
      'tar',
      ['-xzf', join(directory, 'release-state.tar.gz'), '-C', output],
      {
        timeout: 600000,
      },
    );
    cpSync(
      join(output, 'project/licenses/generated'),
      join(root, 'licenses/generated'),
      {
        recursive: true,
      },
    );
    cpSync(
      join(output, 'project/docs/DEPENDENCY_LICENSES.md'),
      join(root, 'docs/DEPENDENCY_LICENSES.md'),
    );
    check('--local');
  }
  const arch = process.env.EXPECTED_ARCH;
  if (arch) {
    const expected: Readonly<Record<string, string>> = {
      amd64: 'x86_64',
      arm64: 'aarch64',
    };
    if (
      run('docker', ['info', '--format', '{{.Architecture}}']).stdout.trim() !==
      expected[arch]
    )
      throw new Error('Runner architecture mismatch');
    if (
      run('docker', [
        'image',
        'inspect',
        '--platform',
        'linux/' + arch,
        '--format',
        '{{.Architecture}}',
        'certlivo:' + version,
      ]).stdout.trim() !== arch
    )
      throw new Error('Image architecture mismatch');
  }
};
