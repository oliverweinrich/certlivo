// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
// Deterministic, fail-closed upstream fix; see docs/ARCHITECTURE.md.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const file = new URL('../node_modules/@root/acme/acme.js', import.meta.url);
const source = readFileSync(file, 'utf8');
const digest = (value: string): string =>
  createHash('sha256').update(value).digest('hex');
const original =
  '448fd51de9018b94482b707396a092957250b05cc1b946d15a73be4ea287aee8';
const expected =
  '1e757d04de49375391c82563069b1cd8aea9c3e5ed62e61be982f5cada5eeff6';
if (digest(source) !== expected) {
  if (digest(source) !== original)
    throw new Error('ACME upstream changed: review compatibility patch');
  const start = source.indexOf('ACME._pollOrderStatus = ');
  const end = source.indexOf('ACME._redeemCert = ', start);
  const polling = source
    .slice(start, end)
    .replace(
      'var payload = JSON.stringify(body);',
      'var payload = JSON.stringify(body);\n\tvar finalized = false;',
    )
    .replace(
      'url: order._finalizeUrl,',
      'url: finalized ? order._orderUrl : order._finalizeUrl,',
    )
    .replace(
      'payload: Enc.strToBuf(payload)',
      "payload: Enc.strToBuf(finalized ? '' : payload)",
    )
    .replace(
      "if ('processing' === resp.body.status) {",
      "if ('processing' === resp.body.status) {\n\t\t\t\tfinalized = true;",
    );
  const result = (
    '// Certlivo modification: RFC 8555 polling, valid authorization reuse and disabled maintainer registration.\n' +
    source.slice(0, start) +
    polling +
    source.slice(end)
  )
    .replace(
      'return ACME._postChallenge(me, options, kid, auth).then(challengeNext);',
      "if ('valid' === auth.status) { return challengeNext(); }\n\t\treturn ACME._postChallenge(me, options, kid, auth).then(challengeNext);",
    )
    .replace(
      '\t\tM.init(me);',
      '\t\t// Certlivo: no maintainer registration or telemetry.',
    );
  if (digest(result) !== expected)
    throw new Error('ACME compatibility patch verification failed');
  writeFileSync(file, result);
}
