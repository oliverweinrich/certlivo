// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { join } from 'node:path';
import { cli, isMain, out, root, write } from '../scripts/lib.ts';
import { render } from './dockerhub-render.ts';
import { publish } from './dockerhub-publish.ts';
export { render } from './dockerhub-render.ts';
export { publish } from './dockerhub-publish.ts';
const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (!['--publish', '--output'].includes(args[i] || ''))
      throw new Error('Usage: dockerhub.ts [--output FILE] [--publish]');
    if (args[i] === '--output' && (!args[++i] || args[i]?.startsWith('--')))
      throw new Error('--output requires path');
  }
  const candidate = render(root, {
    ...(process.env.CERTLIVO_REPOSITORY
      ? { repository: process.env.CERTLIVO_REPOSITORY }
      : {}),
    ...(process.env.GITHUB_REPOSITORY
      ? { githubRepository: process.env.GITHUB_REPOSITORY }
      : {}),
  });
  const output = args.indexOf('--output'),
    file = args[output + 1];
  if (output >= 0 && file) write(join(root, file), candidate.overview);
  else if (!args.includes('--publish'))
    process.stdout.write(candidate.overview);
  if (args.includes('--publish')) {
    await publish(candidate, process.env);
    out(
      'Verified Docker Hub overview: ' +
        candidate.repository +
        ':' +
        candidate.version,
    );
  }
};
if (isMain(import.meta.url)) await cli(main);
