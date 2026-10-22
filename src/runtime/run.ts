// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import type { Config } from '../config/index.js';
import { createCertificates } from '../certificates/index.js';
import { createGateway, startServers } from '../http/index.js';
import { prepareState } from '../state/index.js';
import { startControl } from './control.js';
import type { Status } from './control.js';
import type { Log } from './log.js';

export const run = async (config: Config, log: Log): Promise<void> => {
  const root = await prepareState(
    config.data,
    config.environment,
    config.directory,
  );
  const certificates = createCertificates(config, root, log);
  await certificates.load();
  const gateway = createGateway(config, certificates, log);
  const closeServers = await startServers(config, certificates, gateway);
  let closing = false;
  const status = (): Status => {
    const hosts = certificates.status();
    return {
      ready: !closing && hosts.every((host) => host.active),
      updated: new Date().toISOString(),
      pid: process.pid,
      hosts,
    };
  };
  let closeControl: () => Promise<void>;
  try {
    closeControl = await startControl(
      config.data,
      status,
      (): Promise<void> => certificates.renew(true),
      log,
    );
  } catch (error) {
    await closeServers();
    throw error;
  }
  const tick = (): void => {
    void certificates.renew().catch((): void => {
      log('error', 'certificate worker failed');
    });
  };
  const timer = setInterval(tick, 1000);
  tick();
  log('info', 'gateway started', { hosts: config.hosts.length });
  await new Promise<void>((resolve) => {
    const shutdown = (): void => {
      if (closing) return;
      closing = true;
      clearInterval(timer);
      log('info', 'gateway stopping');
      const deadline = setTimeout((): never => process.exit(1), 10000);
      void Promise.all([closeServers(), closeControl(), certificates.stop()])
        .then((): void => {
          clearTimeout(deadline);
          resolve();
        })
        .catch((): void => {
          log('error', 'shutdown failed');
          process.exitCode = 1;
          clearTimeout(deadline);
          resolve();
        });
    };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
  });
};
