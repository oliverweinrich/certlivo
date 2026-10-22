// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
process.stdout.write(
  createHash('sha256')
    .update(readFileSync('/data/node-acme/staging/ephemeral.test.json'))
    .digest('hex') + '\n',
);
