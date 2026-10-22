// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  cli,
  equalFiles,
  files,
  isMain,
  out,
  read,
  run,
  write,
} from '../scripts/lib.ts';
import { packageRows } from './inventory.ts';
import { fetchRecipe } from './recipe.ts';
import { archiveNotices, collectNotices } from './notices.ts';

const recipeInfo = (
  file: string,
  expression: string,
  env = process.env,
): string =>
  run('bash', ['-c', '. "$1"; ' + expression, 'recipe', file], {
    cwd: dirname(file),
    env,
  }).stdout;
const definition = (file: string, architecture: string): string =>
  recipeInfo(
    file,
    'printf "%s\\n%s\\n%s\\n" "$source" "${sha512sums:-}" "${sha256sums:-}"',
    { ...process.env, CARCH: architecture },
  );
export const collectSources = async (
  output: string,
  cache: string,
): Promise<void> => {
  const uid = process.env.CERTLIVO_OUTPUT_UID || '',
    gid = process.env.CERTLIVO_OUTPUT_GID || '';
  if (!/^\d+$/.test(uid) || !/^\d+$/.test(gid))
    throw new Error('Set numeric output UID/GID');
  mkdirSync(output, { recursive: true });
  mkdirSync(cache, { recursive: true });
  try {
    for (const path of ['alpine', 'licenses/alpine'])
      mkdirSync(join(output, path), { recursive: true });
    for (const path of ['recipes', 'distfiles'])
      mkdirSync(join(cache, path), { recursive: true });
    const rows = packageRows(read(join(output, 'packages.tsv')));
    const unique = [
      ...new Map(
        rows.map((row) => [row.origin + '-' + row.commit, row]),
      ).values(),
    ];
    const arch = run('apk', ['--print-arch']).stdout.trim();
    process.env.CARCH = arch;
    const branch = read('/etc/alpine-release')
      .trim()
      .split('.')
      .slice(0, 2)
      .join('.');
    for (const row of unique) {
      const { origin, commit, version } = row;
      if (!/^[\w+.-]+$/.test(origin) || !/^[a-f0-9]{40}$/.test(commit))
        throw new Error('Invalid recipe provenance');
      const identity = origin + '-' + commit,
        destination = join(output, 'alpine', identity),
        licenses = join(output, 'licenses/alpine', identity);
      if (
        existsSync(join(destination, 'VERIFIED')) &&
        existsSync(join(licenses, 'source-notices.tar.gz'))
      )
        continue;
      const recipe = join(cache, 'recipes', identity + '.tar.gz');
      await fetchRecipe(origin, commit, recipe);
      for (const path of ['recipe', 'sources', 'unpacked'])
        mkdirSync(join(destination, path), { recursive: true });
      run('tar', [
        '-xzf',
        recipe,
        '-C',
        join(destination, 'recipe'),
        '--strip-components=1',
      ]);
      const builds = files(join(destination, 'recipe')).filter((file) =>
        file.endsWith('/APKBUILD'),
      );
      if (builds.length !== 1 || !builds[0])
        throw new Error('Ambiguous recipe');
      const build = builds[0];
      if (recipeInfo(build, 'printf "%s-r%s" "$pkgver" "$pkgrel"') !== version)
        throw new Error('Recipe version mismatch: ' + origin);
      out(`Collecting ${origin} (${version})`);
      const sourceCache = join(cache, 'distfiles', identity);
      mkdirSync(sourceCache, { recursive: true });
      // A filter selects Node's portable JS traversal for Docker bind mounts.
      cpSync(sourceCache, join(destination, 'sources'), {
        recursive: true,
        filter: () => true,
      });
      const verified = run('abuild', ['-F', 'fetch', 'verify'], {
        cwd: dirname(build),
        env: {
          ...process.env,
          CARCH: arch,
          SRCDEST: join(destination, 'sources'),
          DISTFILES_MIRROR: `https://distfiles.alpinelinux.org/distfiles/v${branch}`,
        },
      });
      write(
        join(destination, 'verification.log'),
        verified.stdout + verified.stderr,
      );
      write(
        join(destination, 'checksums.txt'),
        recipeInfo(build, 'printf "%s\\n" "${sha512sums:-${sha256sums:-}}"'),
      );
      cpSync(join(destination, 'sources'), sourceCache, {
        recursive: true,
        filter: () => true,
      });
      for (const archive of files(join(destination, 'sources'))) {
        if (run('tar', ['-tf', archive], { allowFailure: true }).status === 0)
          run('tar', ['-xf', archive, '-C', join(destination, 'unpacked')]);
      }
      collectNotices(destination, licenses);
      rmSync(join(destination, 'unpacked'), { recursive: true, force: true });
      for (const target of ['aarch64', 'x86_64'])
        write(
          join(destination, `source-definition-${target}.txt`),
          definition(build, target),
        );
      equalFiles(
        join(destination, 'source-definition-aarch64.txt'),
        join(destination, 'source-definition-x86_64.txt'),
      );
      write(
        join(destination, 'VERIFIED'),
        `${origin}\t${version}\t${commit}\n`,
      );
    }
    for (const row of unique) {
      const identity = row.origin + '-' + row.commit,
        destination = join(output, 'alpine', identity);
      archiveNotices(
        destination,
        ['sources'],
        join(output, 'licenses/alpine', identity, 'raw-source-notices.tar.gz'),
      );
    }
  } finally {
    // The root-only disposable helper always returns bind mounts to the host UID.
    run('chown', ['-R', uid + ':' + gid, output, cache]);
  }
};
if (isMain(import.meta.url))
  await cli(() => collectSources('/output', '/cache'));
