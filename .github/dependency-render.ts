// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import type { Dependency, Snapshot } from './dependency-types.ts';
export const runtimeInventory = (
  tsv: string,
): Readonly<{ name: string; version: string }>[] => {
  const result = new Map<string, Map<string, string>>();
  for (const line of tsv.trim().split('\n').slice(1)) {
    const [name, version, , , , architecture] = line.split('\t');
    if (!name || !version || !architecture)
      throw new Error('Invalid runtime package inventory');
    const versions = result.get(name) || new Map<string, string>();
    versions.set(architecture, version);
    result.set(name, versions);
  }
  return [...result]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, versions]) => ({
      name,
      version:
        new Set(versions.values()).size === 1
          ? [...versions.values()][0] || ''
          : [...versions].map(([a, v]) => a + ': ' + v).join('; '),
    }));
};
export const render = (
  rows: readonly Dependency[],
  runtime: Snapshot | null,
  helper: Snapshot | null = null,
): string => {
  const lines = [
    '# Dependencies',
    '',
    'Generated with `npm run dependencies`. This snapshot is not an update lockfile.',
    'The manifests and each release inventory are authoritative.',
    '',
    '“Last pin change” is the UTC commit date of the declaration, not the upstream publication date.',
    'Uncommitted lines and missing history are identified explicitly.',
    '',
  ];
  for (const section of new Set(rows.map((row) => row.section))) {
    lines.push(
      '## ' + section,
      '',
      '| Dependency | Configured version / pin | Last pin change | Source | Dependabot / maintenance |',
      '| --- | --- | --- | --- | --- |',
      ...rows
        .filter((row) => row.section === section)
        .map(
          (row) =>
            '| ' +
            [
              row.name,
              row.version,
              row.updated,
              '`' + row.file + '`',
              row.coverage,
            ]
              .map((value) =>
                value.replaceAll('|', '\\|').replaceAll('\n', ' '),
              )
              .join(' | ') +
            ' |',
        ),
      '',
    );
  }
  lines.push(
    '## Runtime OS packages',
    '',
    'Dependabot tracks the Docker image pin and the central package-lock.json.',
    'Scheduled builds refresh Alpine packages and scan actual image contents.',
    '',
  );
  if (runtime)
    lines.push(
      `Published-image snapshot: [${runtime.tag || ''}](${runtime.url || ''}), published ${runtime.date || ''}.`,
      '',
      '| Package | Installed version |',
      '| --- | --- |',
      ...runtime.packages.map((row) => `| ${row.name} | ${row.version} |`),
      '',
    );
  else
    lines.push(
      'Offline report: published package versions are not fetched. Use packages.tsv',
      'from the matching GitHub release or /usr/share/licenses/certlivo/ in that image.',
      '',
    );
  lines.push('## Source helper OS packages', '');
  if (helper)
    lines.push(
      `Build snapshot observed ${helper.observed || ''}; excluded from the runtime.`,
      '',
      '| Package | Installed version |',
      '| --- | --- |',
      ...helper.packages.map((row) => `| ${row.name} | ${row.version} |`),
      '',
    );
  else
    lines.push(
      'The native maintenance artifact contains source-helper-packages.tsv.',
      'Helper packages are separate from the runtime inventory.',
      '',
    );
  lines.push(
    '## Coverage boundaries',
    '',
    '- Runtime and source-helper Node images have separate pinned declarations.',
    '- Alpine helper packages resolve at build time and are scanned independently.',
    '- Certlivo image references in examples are release-managed by npm run version:set.',
    '- .node-version and Node engine requirements need manual major-version review.',
    '- Native runners, Docker, Git and optional actionlint follow their providers.',
    '- Trivy refreshes its vulnerability database during scans.',
    '- Repository security alerts and branch protections need GitHub settings.',
    '',
    'Markdown inventories do not replace the architecture-specific SPDX SBOMs.',
    '',
    '[Maintenance workflow](.github/README.md)',
    '',
  );
  return lines.join('\n');
};
