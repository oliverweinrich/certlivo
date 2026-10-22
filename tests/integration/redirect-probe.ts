// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { request } from './http-client.ts';
const response = await request('http://api.test/api', {
  method: 'POST',
  body: 'body',
});
assert.equal(response.status, 308);
assert.equal(response.headers.location, 'https://api.test/api');
