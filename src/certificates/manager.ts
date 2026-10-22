// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { randomInt } from 'node:crypto';
import type { Config } from '../config/index.js';
import type { Log } from '../runtime/log.js';
import { errorCode } from '../state/index.js';
import { issueCertificate } from './acme.js';
import type { Challenges } from './acme.js';
import { certificate } from './material.js';
import type { ActiveCertificate } from './material.js';
import { importLegacy, loadCertificate, saveCertificate } from './storage.js';
import { verifyActive } from './verify.js';
import { nextCheck } from './schedule.js';

export type Certificates = ReturnType<typeof createCertificates>;
export const createCertificates = (
  config: Config,
  root: string,
  log: Log,
): {
  active: Map<string, ActiveCertificate>;
  challenges: Challenges;
  load: () => Promise<void>;
  renew: (force?: boolean) => Promise<void>;
  status: () => readonly Readonly<{
    host: string;
    tls: boolean;
    active: boolean;
    renewal_error: boolean;
    next_check: number;
  }>[];
  stop: () => Promise<void>;
} => {
  const active = new Map<string, ActiveCertificate>();
  const challenges: Challenges = new Map();
  const failures = new Map<string, number>();
  const next = new Map<string, number>();
  let pending: Promise<void> | null = null;
  let stopped = false;
  const load = async (): Promise<void> => {
    for (const host of config.hosts.filter((item) => item.tls)) {
      try {
        const material =
          (await loadCertificate(root, host.name)) ||
          (await importLegacy(config, root, host.name));
        if (material) active.set(host.name, material);
      } catch (error) {
        log('warn', 'stored certificate unavailable', {
          host: host.name,
          code: errorCode(error),
        });
      }
    }
  };
  const perform = async (force: boolean): Promise<void> => {
    for (const { name, tls } of config.hosts) {
      if (!tls || stopped || (!force && Date.now() < (next.get(name) || 0)))
        continue;
      const old = active.get(name);
      try {
        if (force || !old || Date.now() >= old.renewAt) {
          const material = await issueCertificate(
            config,
            root,
            name,
            challenges,
          );
          const candidate = certificate(name, material);
          await saveCertificate(root, name, material);
          active.set(name, candidate);
          try {
            await verifyActive(name, candidate.fingerprint);
          } catch (error) {
            if (old) active.set(name, old);
            else active.delete(name);
            throw error;
          }
          log('info', 'certificate activated', { host: name });
        }
        failures.delete(name);
        next.set(
          name,
          nextCheck(
            active.get(name)?.renewAt || Date.now(),
            Date.now(),
            randomInt(3600000),
          ),
        );
      } catch (error) {
        const attempts = (failures.get(name) || 0) + 1;
        failures.set(name, attempts);
        next.set(
          name,
          Date.now() +
            Math.min(3600000, 30000 * 2 ** Math.min(attempts - 1, 7)),
        );
        log('error', 'certificate operation failed; retry scheduled', {
          host: name,
          code: errorCode(error),
        });
        if (force)
          throw new Error('Forced renewal failed for ' + name, {
            cause: error,
          });
      }
    }
  };
  const renew = async (force = false): Promise<void> => {
    if (pending) {
      await pending;
      if (force) return renew(true);
      return;
    }
    pending = perform(force);
    try {
      await pending;
    } finally {
      pending = null;
    }
  };
  return {
    active,
    challenges,
    load,
    renew,
    stop: async (): Promise<void> => {
      stopped = true;
      if (pending) await pending;
    },
    status: (): ReturnType<Certificates['status']> =>
      config.hosts.map((host) => ({
        host: host.name,
        tls: host.tls,
        active: !host.tls || (active.get(host.name)?.expires || 0) > Date.now(),
        renewal_error: failures.has(host.name),
        next_check: next.get(host.name) || 0,
      })),
  };
};
