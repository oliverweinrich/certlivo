// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import {
  X509CertificateGenerator,
  BasicConstraintsExtension,
  SubjectAlternativeNameExtension,
  KeyUsagesExtension,
  KeyUsageFlags,
} from '@peculiar/x509';
import { chmodSync } from 'node:fs';
import { join } from 'node:path';
import { write } from '../../scripts/lib.ts';
export const generateCA = async (directory: string): Promise<void> => {
  const keys = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );
  const cert = await X509CertificateGenerator.createSelfSigned({
    name: 'CN=Certlivo test CA',
    keys,
    notBefore: new Date(Date.now() - 86400000),
    notAfter: new Date(Date.now() + 86400000),
    signingAlgorithm: { name: 'ECDSA', hash: 'SHA-256' },
    extensions: [
      new BasicConstraintsExtension(true, undefined, true),
      new SubjectAlternativeNameExtension([{ type: 'dns', value: 'pebble' }]),
      new KeyUsagesExtension(
        KeyUsageFlags.keyCertSign | KeyUsageFlags.digitalSignature,
        true,
      ),
    ],
  });
  const key = Buffer.from(
    await crypto.subtle.exportKey('pkcs8', keys.privateKey),
  )
    .toString('base64')
    .match(/.{1,64}/g)
    ?.join('\n');
  if (!key) throw new Error('Test private key unavailable');
  write(join(directory, 'ca.pem'), cert.toString('pem'));
  write(
    join(directory, 'key.pem'),
    '-----BEGIN PRIVATE KEY-----\n' + key + '\n-----END PRIVATE KEY-----\n',
  );
  chmodSync(join(directory, 'key.pem'), 0o644);
  write(
    join(directory, 'pebble.json'),
    JSON.stringify({
      pebble: {
        listenAddress: '0.0.0.0:14000',
        managementListenAddress: '0.0.0.0:15000',
        certificate: '/fixtures/ca.pem',
        privateKey: '/fixtures/key.pem',
        httpPort: 80,
        tlsPort: 443,
        ocspResponderURL: '',
        externalAccountBindingRequired: false,
        profiles: {
          default: { description: 'Integration', validityPeriod: 7776000 },
        },
      },
    }),
  );
};
