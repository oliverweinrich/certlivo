// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { object, string } from '../scripts/lib.ts';
import { repository } from './dockerhub-render.ts';
import type { Overview } from './dockerhub-render.ts';
export type FetchLike = (
  url: string,
  options: RequestInit,
) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;
export const publish = async (
  candidate: Overview,
  env: Readonly<Record<string, string | undefined>>,
  fetchImpl: FetchLike = fetch,
): Promise<void> => {
  repository(candidate.repository);
  if (!env.DOCKERHUB_USERNAME || !env.DOCKERHUB_TOKEN)
    throw new Error(
      'Set DOCKERHUB_USERNAME and DOCKERHUB_TOKEN with overview access',
    );
  const request = async (
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Pick<Response, 'ok' | 'status' | 'json'>> => {
    let response: Pick<Response, 'ok' | 'status' | 'json'>;
    try {
      response = await fetchImpl('https://hub.docker.com/v2/' + endpoint, {
        ...options,
        redirect: 'error',
        signal: AbortSignal.timeout(30000),
      });
    } catch {
      throw new Error('Docker Hub request failed; retry the overview workflow');
    }
    if (!response.ok)
      throw new Error(
        'Docker Hub returned HTTP ' +
          String(response.status) +
          '; check permissions and retry the overview workflow',
      );
    return response;
  };
  const json = async (
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Record<string, unknown>> => {
    const response = await request(endpoint, options);
    try {
      return object(await response.json());
    } catch {
      throw new Error(
        'Docker Hub returned invalid JSON; retry the overview workflow',
      );
    }
  };
  const tag = await json(
      `repositories/${candidate.repository}/tags/${candidate.version}`,
    ),
    latest = await json(`repositories/${candidate.repository}/tags/latest`);
  if (!tag.digest || tag.digest !== latest.digest)
    throw new Error(
      'VERSION must identify the published latest image; overview was not changed',
    );
  const auth = await json('auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: env.DOCKERHUB_USERNAME,
      secret: env.DOCKERHUB_TOKEN,
    }),
  });
  if (!auth.access_token)
    throw new Error('Docker Hub did not return access token');
  await request('repositories/' + candidate.repository, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + string(auth.access_token),
    },
    body: JSON.stringify({ full_description: candidate.overview }),
  });
  const saved = await json('repositories/' + candidate.repository);
  if (
    typeof saved.full_description !== 'string' ||
    saved.full_description.replaceAll('\r\n', '\n').trimEnd() !==
      candidate.overview.replaceAll('\r\n', '\n').trimEnd()
  )
    throw new Error(
      'Overview verification failed; retry the overview-only workflow',
    );
};
