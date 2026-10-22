#!/usr/bin/env node
// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { acquireLock } from './runtime/lock.js';
import { loadConfig } from './config/index.js';
import { command } from './runtime/command.js';
import { createLog } from './runtime/log.js';
import { run } from './runtime/run.js';

const main = async (): Promise<void> => {
  const name = process.argv[2];
  if (name) {
    await command(name);
    return;
  }
  acquireLock('/data');
  const config = loadConfig((key): string => process.env[key] ?? '');
  await run(config, createLog(config.logLevel));
};
void main().catch((error: unknown): void => {
  createLog('error')(
    'error',
    error instanceof Error ? error.message : 'Gateway failed',
  );
  process.exitCode = 1;
});
