// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { connect } from 'node:tls';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const fingerprint = await new Promise<string>((resolve, reject) => {
  const socket = connect(
    {
      host: 'api.test',
      port: 443,
      servername: 'api.test',
      ca: readFileSync('/fixtures/issued-ca.pem'),
    },
    () => {
      const certificate = socket.getPeerCertificate();
      resolve(createHash('sha256').update(certificate.raw).digest('hex'));
      socket.end();
    },
  );
  socket.setTimeout(5000, () =>
    socket.destroy(new Error('TLS probe timed out')),
  );
  socket.once('error', reject);
});
process.stdout.write(fingerprint + '\n');
