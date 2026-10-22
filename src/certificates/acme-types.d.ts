// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
// Narrow declarations for the reviewed ACME library boundary.
declare module '@root/acme' {
  import type { JsonWebKey } from 'node:crypto';
  export type Challenge = Readonly<{
    type: string;
    altname: string;
    token: string;
    keyAuthorization: string;
  }>;
  export type Request = Readonly<{
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }>;
  export type Response = Readonly<{
    statusCode: number;
    headers: Record<string, string>;
    body: unknown;
  }>;
  export function create(
    options: Readonly<{
      maintainerEmail: string;
      packageAgent: string;
      skipChallengeTest: boolean;
      skipDryRun: boolean;
      notify: () => void;
      __request: (options: Request) => Promise<Response>;
    }>,
  ): Readonly<{
    init: (directory: string) => Promise<unknown>;
    accounts: Readonly<{
      create: (
        options: Readonly<{
          subscriberEmail: string;
          agreeToTerms: boolean;
          accountKey: JsonWebKey;
        }>,
      ) => Promise<unknown>;
    }>;
    certificates: Readonly<{
      create: (
        options: Readonly<{
          accountKey: JsonWebKey;
          subscriberEmail: string;
          agreeToTerms: boolean;
          csr: string;
          domains: readonly string[];
          challenges: Readonly<{
            'http-01': Readonly<{
              get: (
                args: Readonly<{ challenge: Challenge }>,
              ) => Promise<Challenge | null>;
              set: (args: Readonly<{ challenge: Challenge }>) => Promise<void>;
              remove: (
                args: Readonly<{ challenge: Challenge }>,
              ) => Promise<void>;
            }>;
          }>;
        }>,
      ) => Promise<Readonly<{ cert: string; chain: string }>>;
    }>;
  }>;
}
declare module '@root/csr' {
  import type { JsonWebKey } from 'node:crypto';
  export function csr(
    options: Readonly<{
      jwk: JsonWebKey;
      domains: readonly string[];
      encoding: 'pem';
    }>,
  ): Promise<string>;
}
