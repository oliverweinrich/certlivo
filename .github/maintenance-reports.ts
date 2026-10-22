// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { array, object, read, string } from '../scripts/lib.ts';
export const maintenanceReports = (): Readonly<{
  differences: string[];
  vulnerabilities: string[];
  errors: string[];
  reports: number;
}> => {
  const differences: string[] = [],
    vulnerabilities: string[] = [],
    errors: string[] = [];
  let reports = 0;
  for (const directory of existsSync('reports') ? readdirSync('reports') : []) {
    const report = join('reports', directory);
    if (!statSync(report).isDirectory()) continue;
    reports++;
    const diff = join(report, 'packages.diff');
    if (existsSync(diff) && statSync(diff).size)
      differences.push(
        '### ' +
          directory +
          '\n```diff\n' +
          read(diff).slice(0, 6000) +
          '\n```',
      );
    const scan = join(report, 'trivy.json');
    if (!existsSync(scan)) {
      errors.push(directory + ': vulnerability report missing');
      continue;
    }
    try {
      const result = object(JSON.parse(read(scan)));
      for (const entry of array(result.Results || []))
        for (const item of array(object(entry).Vulnerabilities || [])) {
          const row = object(item);
          if (['HIGH', 'CRITICAL'].includes(string(row.Severity)))
            vulnerabilities.push(
              `${directory}: ${string(row.VulnerabilityID)} — ${string(row.PkgName)} ${string(row.InstalledVersion)} (${string(row.Severity)})`,
            );
        }
    } catch {
      errors.push(directory + ': vulnerability report unreadable');
    }
  }
  return { differences, vulnerabilities, errors, reports };
};
