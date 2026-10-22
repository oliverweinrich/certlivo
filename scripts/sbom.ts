// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cli, isMain, root, run, write } from './lib.ts';
export const sbom = (image: string, platform: string, target: string): void => {
  if (!image || !target || !['linux/amd64', 'linux/arm64'].includes(platform))
    throw new Error('Expected image, platform and output');
  const directory = mkdtempSync(join(tmpdir(), 'certlivo-sbom-'));
  const cache = join(root, 'release-cache/trivy');
  mkdirSync(cache, { recursive: true });
  try {
    run(
      'docker',
      ['build', '-t', 'certlivo-scanner:local', join(root, '.github/scanner')],
      { live: true },
    );
    run('docker', [
      'image',
      'save',
      '--platform',
      platform,
      '-o',
      join(directory, 'image.tar'),
      image,
    ]);
    const result = run('docker', [
      'run',
      '--rm',
      '--user',
      `${process.getuid?.() || 0}:${process.getgid?.() || 0}`,
      '--cap-drop',
      'ALL',
      '--security-opt',
      'no-new-privileges:true',
      '--read-only',
      '--tmpfs',
      '/tmp',
      '-v',
      `${directory}:/scan:ro`,
      '-v',
      `${cache}:/cache`,
      'certlivo-scanner:local',
      'image',
      '--cache-dir',
      '/cache',
      '--format',
      'spdx-json',
      '--input',
      '/scan/image.tar',
    ]);
    if (!result.stdout) throw new Error('Empty SBOM');
    write(target, result.stdout);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
};
if (isMain(import.meta.url))
  await cli(() => {
    sbom(process.argv[2] || '', process.argv[3] || '', process.argv[4] || '');
  });
