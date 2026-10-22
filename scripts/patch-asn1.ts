// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
// Preserve EC public-key bytes that can also look like nested ASN.1 elements.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const file = new URL('../node_modules/@root/asn1/parser.js', import.meta.url);
const source = readFileSync(file, 'utf8');
const digest = (value: string): string =>
  createHash('sha256').update(value).digest('hex');
const original =
  'a96c8d73aff943618d9353b3fd20636177ceddee18c6d7010e653fc283009311';
const expected =
  '73d303cd0a1c880bb9f905d2016e6b320158ac54fb5f7f9c1ea665da7aa730f8';
if (digest(source) !== expected) {
  if (digest(source) !== original)
    throw new Error('ASN.1 upstream changed: review compatibility patch');
  const result = (
    '// Certlivo modification: retain primitive bytes alongside parsed children in verbose trees.\n' +
    source
  )
    .replace(
      'delete asn1.value;',
      'if (!opts.preserveValues) { delete asn1.value; }',
    )
    .replace(
      'var opts2 = { json: false !== opts.json };',
      'var opts2 = { json: false !== opts.json, preserveValues: !!opts.verbose };',
    );
  if (digest(result) !== expected)
    throw new Error('ASN.1 compatibility patch verification failed');
  writeFileSync(file, result);
}
