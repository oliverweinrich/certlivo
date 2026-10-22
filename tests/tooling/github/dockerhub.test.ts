// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'yaml';
import { join } from 'node:path';
import { object, read, root } from '../../../scripts/lib.ts';
import { render, publish } from '../../../.github/dockerhub.ts';
import type { FetchLike } from '../../../.github/dockerhub-publish.ts';
import type { Overview } from '../../../.github/dockerhub-render.ts';
const env = { DOCKERHUB_USERNAME: 'test-user', DOCKERHUB_TOKEN: 'test-secret' };
await test('overview uses actual versioned examples and immutable source links', (): void => {
  const ref = 'a'.repeat(40),
    result = render(root, { sourceRef: ref, repository: 'example/gateway' }),
    version = read(join(root, 'VERSION')).trim();
  assert(result.overview.includes(`example/gateway:${version}-sources`));
  assert(
    result.overview.includes('/blob/' + ref + '/examples/CONFIGURATION.md'),
  );
  assert(!result.overview.includes('{{'));
  const examples = [...result.overview.matchAll(/```yaml\n([\s\S]*?)```/g)];
  assert.equal(examples.length, 2);
  for (const match of examples)
    assert.equal(
      object(object(object(parse(match[1] || '')).services).certlivo).image,
      'example/gateway:' + version,
    );
  assert.throws(() => render(root, { sourceRef: 'main' }), /commit SHA/);
  assert.throws(
    () => render(root, { sourceRef: ref, repository: '../invalid' }),
    /repository/,
  );
});
type Call = Readonly<{ url: string; init: RequestInit }>;
const hub = (
  options: Readonly<{
    mismatch?: boolean;
    patchDenied?: boolean;
    badReadback?: boolean;
  }> = {},
): Readonly<{ calls: Call[]; candidate: Overview; fetchImpl: FetchLike }> => {
  const calls: Call[] = [],
    candidate = {
      repository: 'example/gateway',
      version: '1.2.3',
      overview: '# Test overview\n',
    };
  const fetchImpl: FetchLike = (url, init) => {
    calls.push({ url, init });
    const value = url.endsWith('/tags/1.2.3')
      ? { digest: 'sha256:tested' }
      : url.endsWith('/tags/latest')
        ? { digest: options.mismatch ? 'sha256:other' : 'sha256:tested' }
        : url.endsWith('/auth/token')
          ? { access_token: 'mock-access-token' }
          : {
              full_description: options.badReadback
                ? 'old text'
                : candidate.overview,
            };
    const denied = !!options.patchDenied && init.method === 'PATCH';
    return Promise.resolve({
      ok: !denied,
      status: denied ? 403 : 200,
      json: () => Promise.resolve(value),
    });
  };
  return { calls, candidate, fetchImpl };
};
await test('overview writes only full_description and verifies readback', async (): Promise<void> => {
  const h = hub();
  await publish(h.candidate, env, h.fetchImpl);
  const patch = h.calls.find((call) => call.init.method === 'PATCH');
  assert(patch);
  assert(typeof patch.init.body === 'string');
  assert.deepEqual(JSON.parse(patch.init.body), {
    full_description: h.candidate.overview,
  });
  assert.equal(
    new Headers(patch.init.headers).get('Authorization'),
    'Bearer mock-access-token',
  );
  assert(
    h.calls.every(
      (call) =>
        call.url.startsWith('https://hub.docker.com/v2/') &&
        call.init.redirect === 'error',
    ),
  );
});
await test('unpublished versions fail before authentication or mutation', async (): Promise<void> => {
  const h = hub({ mismatch: true });
  await assert.rejects(
    publish(h.candidate, env, h.fetchImpl),
    /published latest/,
  );
  assert.equal(h.calls.length, 2);
  await assert.rejects(
    publish(h.candidate, {}, h.fetchImpl),
    /DOCKERHUB_USERNAME/,
  );
});
await test('permission/readback errors are actionable and do not expose credentials', async (): Promise<void> => {
  for (const options of [{ patchDenied: true }, { badReadback: true }]) {
    const h = hub(options);
    await assert.rejects(
      publish(h.candidate, env, h.fetchImpl),
      (error: unknown): boolean => {
        assert(error instanceof Error);
        assert(!error.message.includes(env.DOCKERHUB_TOKEN));
        return /retry/.test(error.message);
      },
    );
  }
});
