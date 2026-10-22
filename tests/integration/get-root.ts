// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { request } from './http-client.ts';
const result = await request('https://pebble:15000/roots/0', {
  ca: '/fixtures/ca.pem',
});
if (result.status !== 200 || !result.body.includes('BEGIN CERTIFICATE'))
  throw new Error('Test CA root unavailable');
process.stdout.write(result.body);
