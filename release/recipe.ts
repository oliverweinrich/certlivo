// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import {
  createReadStream,
  createWriteStream,
  existsSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { createGunzip, createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { extract, pack } from 'tar-stream';
import { run, out } from '../scripts/lib.ts';
import { download } from './download.ts';
export const recipePath = (name: string, origin: string): string | null => {
  const parts = name.split('/');
  if (name.startsWith('/') || parts.includes('..'))
    throw new Error('Unsafe recipe archive path');
  return parts.length >= 4 &&
    ['main', 'community'].includes(parts[1] || '') &&
    parts[2] === origin
    ? 'aports/' + parts.slice(1).join('/')
    : null;
};
export const validRecipe = (file: string, origin: string): boolean => {
  if (!existsSync(file)) return false;
  const result = run('tar', ['-tzf', file], { allowFailure: true });
  return (
    result.status === 0 &&
    result.stdout
      .split('\n')
      .some((name) =>
        ['main', 'community'].some(
          (repository) => name === `aports/${repository}/${origin}/APKBUILD`,
        ),
      )
  );
};
export const normalizeRecipe = async (
  source: string,
  destination: string,
  origin: string,
): Promise<boolean> => {
  const unpacker = extract();
  const transfer = pipeline(createReadStream(source), createGunzip(), unpacker);
  // Attach immediately so parser failures never become unhandled rejections.
  void transfer.catch(() => {});
  const selected: { name: string; content: Buffer; mode: number }[] = [];
  try {
    for await (const entry of unpacker) {
      const name = recipePath(entry.header.name, origin);
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of entry) {
        if (!Buffer.isBuffer(chunk))
          throw new Error('Invalid TAR stream chunk');
        if (name && entry.header.type === 'file') {
          size += chunk.length;
          if (size > 32 * 1024 * 1024) throw new Error('Recipe file too large');
          chunks.push(chunk);
        }
      }
      if (name && entry.header.type === 'file')
        selected.push({
          name,
          content: Buffer.concat(chunks),
          mode: entry.header.mode || 0o644,
        });
    }
    await transfer;
    if (
      selected.filter((entry) => entry.name.endsWith('/APKBUILD')).length !== 1
    )
      return false;
    const archive = pack();
    const saving = pipeline(
      archive,
      createGzip({ level: 1 }),
      createWriteStream(destination),
    );
    for (const entry of selected)
      archive.entry({ name: entry.name, mode: entry.mode }, entry.content);
    archive.finalize();
    await saving;
    return true;
  } catch (error) {
    unpacker.destroy();
    await transfer.catch(() => {});
    throw error;
  }
};
export const fetchRecipe = async (
  origin: string,
  commit: string,
  destination: string,
  fetchDownload: typeof download = download,
): Promise<void> => {
  if (!/^[a-zA-Z0-9_+.-]+$/.test(origin) || !/^[0-9a-f]{40}$/.test(commit))
    throw new Error('Invalid recipe provenance');
  if (validRecipe(destination, origin)) return;
  const urls = [
    `https://codeload.github.com/alpinelinux/aports/tar.gz/${commit}`,
    ...['main', 'community'].map(
      (repo) =>
        `https://gitlab.alpinelinux.org/api/v4/projects/alpine%2Faports/repository/archive.tar.gz?sha=${commit}&path=${repo}/${origin}`,
    ),
  ];
  const input = destination + '.download-tar',
    temporary = destination + '.tmp';
  try {
    for (const url of urls) {
      out(`Recipe lookup: ${origin} at ${commit} via ${url}`);
      try {
        fetchDownload(url, input, false);
        if (await normalizeRecipe(input, temporary, origin)) {
          renameSync(temporary, destination);
          return;
        }
      } catch {
        out('Recipe lookup unsuccessful; trying next official source.');
      }
    }
    throw new Error(`Cannot retrieve recipe for ${origin} at ${commit}`);
  } finally {
    rmSync(input, { force: true });
    rmSync(temporary, { force: true });
  }
};
