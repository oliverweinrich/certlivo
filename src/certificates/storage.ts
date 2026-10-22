// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { readFile, realpath } from 'node:fs/promises';
import { join } from 'node:path';
import type { Config } from '../config/index.js';
import {
  atomicWrite,
  errorCode,
  readOptional,
  within,
} from '../state/index.js';
import { certificate, parseMaterial } from './material.js';
import type { ActiveCertificate, Material } from './material.js';

export const certificatePath = (root: string, host: string): string =>
  join(root, host + '.json');
export const saveCertificate = async (
  root: string,
  host: string,
  material: Material,
): Promise<void> =>
  atomicWrite(certificatePath(root, host), JSON.stringify(material));
export const loadCertificate = async (
  root: string,
  host: string,
): Promise<ActiveCertificate | null> => {
  const raw = await readOptional(certificatePath(root, host));
  if (!raw) return null;
  const material = parseMaterial(JSON.parse(raw));
  return certificate(host, material);
};
export const importLegacy = async (
  config: Config,
  root: string,
  host: string,
): Promise<ActiveCertificate | null> => {
  const legacy = join(config.data, 'acme', config.environment);
  try {
    const paths = await Promise.all(
      ['fullchain.pem', 'privkey.pem'].map((name) =>
        realpath(join(legacy, 'live', host, name)),
      ),
    );
    if (paths.some((path) => !within(legacy, path)))
      throw new Error('Legacy certificate escaped its state directory');
    const [cert, key] = await Promise.all(
      paths.map((path) => readFile(path, 'utf8')),
    );
    if (!cert || !key) throw new Error('Incomplete legacy certificate');
    const active = certificate(host, { cert, key });
    await saveCertificate(root, host, active.material);
    return active;
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return null;
    throw error;
  }
};
