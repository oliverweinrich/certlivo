// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { test } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { write } from '../../../scripts/lib.ts';
import { notify } from '../../../.github/maintenance-issue.ts';
import type {
  GitHub,
  GitHubContext,
  Issue,
} from '../../../.github/maintenance-issue.ts';
const firstWrite = (
  writes: readonly Record<string, unknown>[],
): Record<string, unknown> => {
  const value = writes[0];
  assert(value);
  return value;
};
const fixture = (
  t: TestContext,
  existing: readonly Issue[] = [],
): Readonly<{
  github: GitHub;
  context: GitHubContext;
  writes: Record<string, unknown>[];
}> => {
  const cwd = process.cwd(),
    directory = mkdtempSync(join(tmpdir(), 'certlivo-issue-'));
  process.chdir(directory);
  t.after(() => {
    process.chdir(cwd);
    rmSync(directory, { recursive: true, force: true });
  });
  for (const arch of ['amd64', 'arm64']) {
    write(`reports/maintenance-${arch}/packages.diff`, '');
    write(
      `reports/maintenance-${arch}/trivy.json`,
      JSON.stringify({ Results: [] }),
    );
  }
  const writes: Record<string, unknown>[] = [];
  const github: GitHub = {
    paginate: () => Promise.resolve(existing),
    rest: {
      issues: {
        listForRepo: (): void => {},
        create: (value) =>
          Promise.resolve(writes.push({ action: 'create', ...value })),
        update: (value) =>
          Promise.resolve(writes.push({ action: 'update', ...value })),
      },
    },
  };
  return {
    github,
    context: {
      repo: { owner: 'example', repo: 'gateway' },
      serverUrl: 'https://github.com',
      runId: 123,
    },
    writes,
  };
};
await test('clean reports do not create an issue', async (t): Promise<void> => {
  const f = fixture(t);
  await notify({ ...f, result: 'success' });
  assert.equal(f.writes.length, 0);
});
await test('package changes create actionable issues', async (t): Promise<void> => {
  const f = fixture(t);
  write('reports/maintenance-amd64/packages.diff', '-node old\n+node new');
  await notify({ ...f, result: 'success' });
  assert.equal(f.writes[0]?.action, 'create');
  assert.match(String(f.writes[0].body), /node new/);
  assert.match(String(f.writes[0].body), /actions\/runs\/123/);
});
await test('known vulnerabilities update an existing issue', async (t): Promise<void> => {
  const f = fixture(t, [{ title: 'Dependency maintenance', number: 7 }]);
  write(
    'reports/maintenance-arm64/trivy.json',
    JSON.stringify({
      Results: [
        {
          Vulnerabilities: [
            {
              VulnerabilityID: 'CVE-TEST',
              PkgName: 'test',
              InstalledVersion: '1',
              Severity: 'HIGH',
            },
          ],
        },
      ],
    }),
  );
  await notify({ ...f, result: 'failure' });
  assert.equal(f.writes[0]?.action, 'update');
  assert.equal(f.writes[0].issue_number, 7);
  assert.match(String(f.writes[0].body), /CVE-TEST/);
});
await test('resolved checks close an existing issue', async (t): Promise<void> => {
  const f = fixture(t, [{ title: 'Dependency maintenance', number: 7 }]);
  await notify({ ...f, result: 'success' });
  assert.equal(f.writes[0]?.state, 'closed');
});
await test('missing or unreadable reports remain visible', async (t): Promise<void> => {
  const f = fixture(t);
  write('reports/maintenance-amd64/trivy.json', 'broken');
  rmSync('reports/maintenance-arm64/trivy.json');
  await notify({ ...f, result: 'success' });
  assert.match(String(firstWrite(f.writes).body), /unreadable/);
  assert.match(String(firstWrite(f.writes).body), /missing/);
});
await test('failed checks remain visible without artifacts', async (t): Promise<void> => {
  const f = fixture(t);
  rmSync('reports', { recursive: true });
  await notify({ ...f, result: 'failure' });
  assert.match(String(firstWrite(f.writes).body), /found 0/);
});
