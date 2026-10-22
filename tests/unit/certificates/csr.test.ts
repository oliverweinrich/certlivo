// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { test } from 'node:test';
import CSR from '@root/csr';
import ASN1 from '@root/asn1/parser.js';
// Public request only; no private key is retained in this regression fixture.
const request =
  '-----BEGIN CERTIFICATE REQUEST-----\nMIHzMIGbAgEAMBMxETAPBgNVBAMMCGFwaS50ZXN0MFkwEwYHKoZIzj0CAQYIKoZI\nzj0DAQcDQgAEP+3d9dClo5BjsSHcZ8X9bG4aqoNZR363Y55SSLh1KYKjxkL3KYhD\n+QA7DlEMIg7+qJRhx1C4f+x5vZCnRC6YUKAmMCQGCSqGSIb3DQEJDjEXMBUwEwYD\nVR0RBAwwCoIIYXBpLnRlc3QwCgYIKoZIzj0EAwIDRwAwRAIgDe44WNLetgV0lwt4\nhnypNcYDQ/O6WzDRnlbWTIlVJUUCIGLvIOxBhMYqKX2gmSwJ37bAqt2PdL+k0gWa\nhdrHv7dz\n-----END CERTIFICATE REQUEST-----';
await test('CSR inspection retains an EC point that also parses as nested ASN.1', (): void => {
  const info = CSR._info(request);
  assert.equal(info.subject, 'api.test');
  assert.deepEqual(info.altnames, ['api.test']);
  assert.deepEqual(info.jwk, {
    kty: 'EC',
    x: 'P-3d9dClo5BjsSHcZ8X9bG4aqoNZR363Y55SSLh1KYI',
    y: 'o8ZC9ymIQ_kAOw5RDCIO_qiUYcdQuH_seb2Qp0QumFA',
    crv: 'P-256',
  });
});

await test('compact ASN.1 output is unchanged while verbose output retains raw bytes', (): void => {
  const der = Buffer.from([0x03, 0x04, 0x00, 0x04, 0x01, 0xaa]);
  assert.deepEqual(ASN1.parse({ der }), ['03', [['04', 'aa']]]);
  const verbose = ASN1.parse({ der, verbose: true, json: false });
  assert(verbose && typeof verbose === 'object' && 'value' in verbose);
  assert.deepEqual(verbose.value, Buffer.from([0x04, 0x01, 0xaa]));
});
