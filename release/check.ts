// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import {
  cli,
  equalFiles,
  files,
  isMain,
  out,
  run,
  write,
} from '../scripts/lib.ts';
import { artifacts, context } from './context.ts';
import { verifyChecksums } from './checksums.ts';
import { stageLegal } from '../scripts/stage-legal.ts';
import { download } from './download.ts';
export const check = (mode = 'public'): void => {
  if (!['public', '--local'].includes(mode))
    throw new Error('Usage: release:check [--local]');
  const { version, output, image } = context();
  if (!existsSync(join(output, 'COMPLETE')))
    throw new Error('Release not prepared');
  verifyChecksums(output);
  const work = mkdtempSync(join(tmpdir(), 'certlivo-check-'));
  try {
    const expectedNotices = join(work, 'expected-notices');
    stageLegal(join(output, 'project'), expectedNotices);
    if (mode === 'public') {
      const url = process.env.RELEASE_URL;
      if (!url?.startsWith('https://'))
        throw new Error('Set public HTTPS RELEASE_URL');
      for (const name of artifacts(version)) {
        download(url + '/' + name, join(work, name), false);
        equalFiles(join(output, name), join(work, name));
      }
    }
    for (const arch of ['amd64', 'arm64']) {
      const platform = 'linux/' + arch;
      if (
        run('docker', [
          'image',
          'inspect',
          '--platform',
          platform,
          '--format',
          '{{index .Config.Labels "org.opencontainers.image.version"}}',
          image,
        ]).stdout.trim() !== version
      )
        throw new Error('Image version mismatch');
      const execute = (entry: string, args: readonly string[]): string =>
        run('docker', [
          'run',
          '--rm',
          '--platform',
          platform,
          '--network',
          'none',
          '--entrypoint',
          entry,
          image,
          ...args,
        ]).stdout;
      write(
        join(work, arch + '.tsv'),
        execute('cat', ['/usr/share/licenses/certlivo/packages.tsv']),
      );
      equalFiles(
        join(work, arch + '.tsv'),
        join(output, `seed/linux_${arch}/packages.tsv`),
      );
      write(
        join(work, arch + '.sha256'),
        execute('node', ['/usr/local/share/certlivo/hash-runtime.ts']),
      );
      equalFiles(
        join(work, arch + '.sha256'),
        join(output, `seed/linux_${arch}/runtime-files.sha256`),
      );
      const name = 'certlivo-notices-' + arch + '-' + String(process.pid);
      run('docker', ['create', '--name', name, '--platform', platform, image]);
      try {
        run('docker', [
          'cp',
          name + ':/usr/share/licenses/certlivo',
          join(work, arch),
        ]);
        if (!existsSync(join(expectedNotices, 'release.json')))
          throw new Error('Missing release notice');
        const expectedFiles = files(expectedNotices).map((file) =>
          relative(expectedNotices, file),
        );
        const metadata = [
          'packages.tsv',
          'runtime-files.sha256',
          'node-version',
        ];
        const actualFiles = files(join(work, arch))
          .map((file) => relative(join(work, arch), file))
          .filter(
            (file) => !file.startsWith('npm/') && !metadata.includes(file),
          );
        if (JSON.stringify(expectedFiles) !== JSON.stringify(actualFiles))
          throw new Error(
            'Runtime license file set differs from the prepared sources',
          );
        for (const notice of files(expectedNotices))
          equalFiles(
            notice,
            join(work, arch, relative(expectedNotices, notice)),
          );
        const expectedNpm = join(output, `seed/linux_${arch}/licenses/npm`);
        const actualNpm = join(work, arch, 'npm');
        if (
          JSON.stringify(
            files(expectedNpm).map((file) => relative(expectedNpm, file)),
          ) !==
          JSON.stringify(
            files(actualNpm).map((file) => relative(actualNpm, file)),
          )
        )
          throw new Error(
            'Runtime npm notice file set differs from the prepared seed',
          );
        for (const notice of files(
          join(output, `seed/linux_${arch}/licenses/npm`),
        ))
          equalFiles(
            notice,
            join(
              work,
              arch,
              'npm',
              relative(join(output, `seed/linux_${arch}/licenses/npm`), notice),
            ),
          );
      } finally {
        run('docker', ['rm', name], { allowFailure: true });
      }
    }
    out(
      mode === '--local'
        ? 'Local candidate matches sources and notices; public availability remains unchecked.'
        : 'Public source and runtime checks passed; no legal opinion.',
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
};
if (isMain(import.meta.url))
  await cli(() => {
    check(process.argv[2]);
  });
