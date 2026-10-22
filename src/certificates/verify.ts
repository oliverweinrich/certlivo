// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { connect } from 'node:tls';

export const verifyActive = (
  host: string,
  fingerprint: string,
): Promise<void> =>
  new Promise((resolve, reject) => {
    // The material is validated before activation; compare the exact served leaf.
    const socket = connect({
      host: '127.0.0.1',
      port: 443,
      servername: host,
      rejectUnauthorized: false,
    });
    socket.setTimeout(2000, (): void => {
      socket.destroy(new Error('TLS readiness timed out'));
    });
    socket.once('error', reject);
    socket.once('secureConnect', (): void => {
      const matches =
        socket.getPeerCertificate().fingerprint256 === fingerprint;
      socket.end();
      if (!matches) {
        reject(new Error('Served certificate fingerprint mismatch'));
        return;
      }
      resolve();
    });
  });
