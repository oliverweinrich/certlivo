// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { maintenanceReports } from './maintenance-reports.ts';
export type Issue = Readonly<{
  title: string;
  number: number;
  pull_request?: unknown;
}>;
export type GitHub = Readonly<{
  paginate: (
    method: unknown,
    options: Record<string, unknown>,
  ) => Promise<readonly Issue[]>;
  rest: Readonly<{
    issues: Readonly<{
      listForRepo: unknown;
      create: (input: Record<string, unknown>) => Promise<unknown>;
      update: (input: Record<string, unknown>) => Promise<unknown>;
    }>;
  }>;
}>;
export type GitHubContext = Readonly<{
  repo: Readonly<{ owner: string; repo: string }>;
  serverUrl: string;
  runId: number;
}>;
export const notify = async ({
  github,
  context,
  result,
}: Readonly<{
  github: GitHub;
  context: GitHubContext;
  result: string;
}>): Promise<void> => {
  const { differences, vulnerabilities, errors, reports } =
    maintenanceReports();
  const title = 'Dependency maintenance';
  const issues = await github.paginate(github.rest.issues.listForRepo, {
    ...context.repo,
    state: 'open',
    creator: 'github-actions[bot]',
    per_page: 100,
  });
  const existing = issues.find(
    (issue) => issue.title === title && !issue.pull_request,
  );
  const attention =
    differences.length ||
    vulnerabilities.length ||
    errors.length ||
    reports !== 2 ||
    result !== 'success';
  if (!attention) {
    if (existing)
      await github.rest.issues.update({
        ...context.repo,
        issue_number: existing.number,
        state: 'closed',
      });
    return;
  }
  const run = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
  const body = [
    'Automated weekly/manual dependency review. No image has been published.',
    `Checks: **${result}**. [Reports and logs](${run})`,
    ...errors,
    reports !== 2
      ? `Expected two architecture reports; found ${reports}. Inspect the workflow run.`
      : '',
    vulnerabilities.length
      ? '### Known high/critical vulnerabilities\n' +
        vulnerabilities
          .slice(0, 40)
          .map((item) => '- ' + item)
          .join('\n')
      : '',
    ...differences,
    'Review Dependabot pull requests and reports before preparing a new version; see `.github/README.md`.',
  ]
    .filter(Boolean)
    .join('\n\n');
  if (existing)
    await github.rest.issues.update({
      ...context.repo,
      issue_number: existing.number,
      body,
    });
  else await github.rest.issues.create({ ...context.repo, title, body });
};
