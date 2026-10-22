// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { join } from 'node:path';
import { read, run } from '../scripts/lib.ts';
import { stableVersion } from '../release/context.ts';
export type Overview = Readonly<{
  overview: string;
  version: string;
  repository: string;
}>;
export type OverviewOptions = Readonly<{
  repository?: string;
  githubRepository?: string;
  sourceRef?: string;
}>;
export const repository = (value: string): string => {
  if (!/^[a-z0-9][a-z0-9_-]*\/[a-z0-9][a-z0-9_.-]*$/.test(value))
    throw new Error('Invalid Docker Hub repository');
  return value;
};
export const render = (
  root: string,
  options: OverviewOptions = {},
): Overview => {
  const version = stableVersion(read(join(root, 'VERSION')).trim()),
    repo = repository(options.repository || 'oliverweinrich/certlivo');
  const github = options.githubRepository || 'oliverweinrich/certlivo';
  if (!/^[\w.-]+\/[\w.-]+$/.test(github))
    throw new Error('Invalid GitHub repository');
  const ref =
    options.sourceRef ||
    run('git', ['rev-parse', 'HEAD'], { cwd: root }).stdout.trim();
  if (!/^[a-f0-9]{40}$/.test(ref))
    throw new Error('Source reference must be full commit SHA');
  const compose = (role: string): string => {
    const text = read(join(root, `examples/compose.${role}.yaml`)).trim();
    if (!text.includes(`image: oliverweinrich/certlivo:${version}\n`))
      throw new Error('Example version mismatch');
    return (
      '```yaml\n' +
      text.replaceAll(
        'image: oliverweinrich/certlivo:' + version,
        'image: ' + repo + ':' + version,
      ) +
      '\n```'
    );
  };
  const values: Readonly<Record<string, string>> = {
    VERSION: version,
    REPOSITORY: repo,
    PROJECT_URL: 'https://github.com/' + github,
    SOURCE_URL: `https://github.com/${github}/blob/${ref}`,
    SERVER_COMPOSE: compose('routes'),
    CLIENT_COMPOSE: compose('api'),
  };
  const overview = read(join(root, 'docs/DOCKERHUB.template.md')).replace(
    /\{\{([^{}]+)\}\}/g,
    (_match: string, key: string): string => {
      const value = values[key];
      if (value === undefined) throw new Error('Unknown overview placeholder');
      return value;
    },
  );
  return { overview, version, repository: repo };
};
