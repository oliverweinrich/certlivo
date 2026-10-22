// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { cpSync, existsSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import { files } from '../scripts/lib.ts';
export const packageProject = (root: string, target: string): void => {
  rmSync(target, { recursive: true, force: true });
  const top = [
    'LICENSE',
    'NOTICE',
    'README.md',
    'THIRD_PARTY_NOTICES.md',
    'SECURITY.md',
    'AGENTS.md',
    'DEPENDENCIES.md',
    'VERSION',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'tsconfig.tools.json',
    'tsconfig.tests.json',
    'eslint.config.mjs',
    '.dockerignore',
    '.prettierrc.json',
    '.prettierignore',
    '.gitignore',
    '.node-version',
    '.npmrc',
  ];
  for (const name of top)
    cpSync(join(root, name), join(target, name), { recursive: true });
  for (const directory of [
    'src',
    'scripts',
    'release',
    'tests',
    'docs',
    'examples',
    '.github',
    '.husky',
    '.vscode',
    'image',
    'licenses',
  ]) {
    for (const file of files(join(root, directory))) {
      const path = relative(root, file);
      if (
        path.includes('/node_modules/') ||
        path.includes('/dist/') ||
        path.startsWith('.husky/_/')
      )
        continue;
      if (
        !path.startsWith('licenses/') &&
        !/\.(ts|mjs|cjs|md|yaml|yml|json|txt)$/.test(path) &&
        !path.endsWith('Dockerfile') &&
        ![
          '.husky/pre-commit',
          '.husky/pre-push',
          'licenses/generated/.gitkeep',
        ].includes(path)
      )
        continue;
      if (existsSync(file))
        cpSync(file, join(target, path), { recursive: true });
    }
  }
};
