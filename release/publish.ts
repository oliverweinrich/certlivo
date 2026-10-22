// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  array,
  cli,
  isMain,
  object,
  out,
  run,
  string,
  write,
} from '../scripts/lib.ts';
import type { Result } from '../scripts/lib.ts';
import { artifacts, context } from './context.ts';
import { check } from './check.ts';
export const assertUnused = async (
  version: string,
  tagStatus: (tag: string) => Promise<number>,
  githubRelease: () => Result,
): Promise<void> => {
  for (const tag of [version, version + '-sources'])
    if ((await tagStatus(tag)) !== 404)
      throw new Error('Tag exists or cannot be checked: ' + tag);
  const result = githubRelease();
  if (result.status === 0 || !result.stderr.includes('HTTP 404'))
    throw new Error('GitHub release exists or cannot be checked');
};
export const publish = async (preflightOnly: boolean): Promise<void> => {
  const { root, version, output, image } = context();
  const repository =
    process.env.CERTLIVO_REPOSITORY || 'oliverweinrich/certlivo';
  if (!/^[a-z0-9][a-z0-9_-]*\/[a-z0-9][a-z0-9_.-]*$/.test(repository))
    throw new Error('Invalid repository');
  const github =
    process.env.GITHUB_REPOSITORY ||
    run('gh', [
      'repo',
      'view',
      '--json',
      'nameWithOwner',
      '--jq',
      '.nameWithOwner',
    ]).stdout.trim();
  if (!/^[\w.-]+\/[\w.-]+$/.test(github))
    throw new Error('Invalid GitHub repository');
  await assertUnused(
    version,
    async (tag): Promise<number> => {
      const response = await fetch(
        `https://hub.docker.com/v2/repositories/${repository}/tags/${tag}/`,
        { redirect: 'error', signal: AbortSignal.timeout(30000) },
      );
      return response.status;
    },
    () =>
      run('gh', ['api', `repos/${github}/releases/tags/v${version}`], {
        allowFailure: true,
      }),
  );
  if (preflightOnly) {
    out('Version is available: ' + version);
    return;
  }
  check('--local');
  const work = mkdtempSync(join(tmpdir(), 'certlivo-publish-'));
  try {
    for (const name of artifacts(version))
      cpSync(join(output, name), join(work, name));
    cpSync(join(root, 'release/Archives.Dockerfile'), join(work, 'Dockerfile'));
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
        repository + ':' + version + '-sources',
        work,
      ],
      { live: true },
    );
    run('gh', [
      'release',
      'create',
      'v' + version,
      '--repo',
      github,
      '--target',
      run('git', ['rev-parse', 'HEAD']).stdout.trim(),
      '--title',
      'Certlivo ' + version,
      '--generate-notes',
      '--draft',
    ]);
    run('gh', [
      'release',
      'upload',
      'v' + version,
      '--repo',
      github,
      ...artifacts(version).map((name) => join(output, name)),
    ]);
    run('gh', [
      'release',
      'edit',
      'v' + version,
      '--repo',
      github,
      '--draft=false',
    ]);
    const previous = process.env.RELEASE_URL;
    process.env.RELEASE_URL = `https://github.com/${github}/releases/download/v${version}`;
    try {
      check();
    } finally {
      if (previous) process.env.RELEASE_URL = previous;
      else Reflect.deleteProperty(process.env, 'RELEASE_URL');
    }
    run('docker', ['push', repository + ':' + version + '-sources'], {
      live: true,
    });
    for (const tag of [version, 'latest']) {
      run('docker', ['tag', image, repository + ':' + tag]);
      run('docker', ['push', repository + ':' + tag], { live: true });
    }
    const manifests: string[] = [];
    for (const tag of [version, 'latest', version + '-sources']) {
      const manifest = run('docker', [
        'manifest',
        'inspect',
        repository + ':' + tag,
      ]).stdout;
      const platforms = array(object(JSON.parse(manifest)).manifests).map(
        (entry) => {
          const platform = object(object(entry).platform);
          return string(platform.os) + '/' + string(platform.architecture);
        },
      );
      if (
        !['linux/amd64', 'linux/arm64'].every((platform) =>
          platforms.includes(platform),
        )
      )
        throw new Error('Published manifest lacks a target architecture');
      manifests.push(manifest);
      write(join(work, tag + '.json'), manifest);
    }
    if (manifests[0] !== manifests[1])
      throw new Error('Latest differs from immutable version');
    out('Published sources and tested images: ' + repository + ':' + version);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
};
if (isMain(import.meta.url))
  await cli(() => {
    if (process.argv.slice(2).some((arg) => arg !== '--check'))
      throw new Error('Usage: release:publish [--check]');
    return publish(process.argv.includes('--check'));
  });
