// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { createPrivateKey, X509Certificate } from 'node:crypto';
import { createSecureContext } from 'node:tls';
import type { SecureContext } from 'node:tls';

export type Material = Readonly<{ key: string; cert: string }>;
export type ActiveCertificate = Readonly<{
  material: Material;
  context: SecureContext;
  fingerprint: string;
  expires: number;
  renewAt: number;
}>;
export const certificate = (
  host: string,
  material: Material,
  now = Date.now(),
): ActiveCertificate => {
  const leaf = new X509Certificate(material.cert);
  const starts = Date.parse(leaf.validFrom);
  const expires = Date.parse(leaf.validTo);
  if (
    !leaf.checkHost(host, { subject: 'never' }) ||
    now < starts ||
    now >= expires
  )
    throw new Error('Certificate identity or validity failed');
  if (!leaf.checkPrivateKey(createPrivateKey(material.key)))
    throw new Error('Certificate private key mismatch');
  const margin = Math.min(30 * 86400000, (expires - starts) / 3);
  return {
    material,
    context: createSecureContext(material),
    fingerprint: leaf.fingerprint256,
    expires,
    renewAt: expires - margin,
  };
};
export const parseMaterial = (input: unknown): Material => {
  if (
    !input ||
    typeof input !== 'object' ||
    !('key' in input) ||
    !('cert' in input) ||
    typeof input.key !== 'string' ||
    typeof input.cert !== 'string'
  )
    throw new Error('Invalid certificate state');
  return { key: input.key, cert: input.cert };
};
