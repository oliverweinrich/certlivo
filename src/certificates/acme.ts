// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import ACME from '@root/acme';
import CSR from '@root/csr';
import { createPrivateKey, generateKeyPairSync } from 'node:crypto';
import { join } from 'node:path';
import type { Config } from '../config/index.js';
import { atomicWrite, readOptional } from '../state/index.js';
import type { Material } from './material.js';
import { createTransport } from './transport.js';

export type Challenges = Map<string, string>;
const generateKey = (): string =>
  generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
    .privateKey.export({ format: 'pem', type: 'pkcs8' })
    .toString();
export const issueCertificate = async (
  config: Config,
  root: string,
  host: string,
  challenges: Challenges,
): Promise<Material> => {
  let accountPem = await readOptional(join(root, 'account.pem'));
  if (!accountPem) {
    accountPem = generateKey();
    await atomicWrite(join(root, 'account.pem'), accountPem);
  }
  const accountKey = createPrivateKey(accountPem).export({ format: 'jwk' });
  const client = ACME.create({
    // Registration is blocked by the issuer-only transport; no user data is sent.
    maintainerEmail: 'security@example.invalid',
    packageAgent: 'certlivo/1',
    skipChallengeTest: true,
    skipDryRun: true,
    notify: (): void => {},
    __request: createTransport(config.directory, Date.now() + 120000),
  });
  await client.init(config.directory);
  const key = generateKey();
  const request = await CSR.csr({
    jwk: createPrivateKey(key).export({ format: 'jwk' }),
    domains: [host],
    encoding: 'pem',
  });
  try {
    const result = await client.certificates.create({
      accountKey,
      subscriberEmail: config.email,
      agreeToTerms: true,
      csr: request,
      domains: [host],
      challenges: {
        'http-01': {
          get: ({ challenge }) =>
            Promise.resolve(
              challenges.has(host + '/' + challenge.token) ? challenge : null,
            ),
          set: ({ challenge }): Promise<void> => {
            if (
              challenge.type !== 'http-01' ||
              challenge.altname !== host ||
              !/^[a-zA-Z0-9_-]+$/.test(challenge.token) ||
              !/^[a-zA-Z0-9_.-]+$/.test(challenge.keyAuthorization)
            )
              throw new Error('Unexpected ACME challenge');
            challenges.set(
              host + '/' + challenge.token,
              challenge.keyAuthorization,
            );
            return Promise.resolve();
          },
          remove: ({ challenge }): Promise<void> => {
            challenges.delete(host + '/' + challenge.token);
            return Promise.resolve();
          },
        },
      },
    });
    return { key, cert: result.cert + '\n' + result.chain + '\n' };
  } finally {
    for (const token of challenges.keys())
      if (token.startsWith(host + '/')) challenges.delete(token);
  }
};
