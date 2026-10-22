// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
export type Update = Readonly<{
  'package-ecosystem': string;
  directory?: string;
  directories?: readonly string[];
  schedule: Readonly<{ interval: string }>;
  ignore?: readonly Readonly<{
    'dependency-name': string;
    'update-types'?: readonly string[];
    versions?: readonly string[];
  }>[];
}>;
export type Policy = Readonly<{ updates: readonly Update[] }>;
export type Dependency = Readonly<{
  section: string;
  name: string;
  version: string;
  file: string;
  updated: string;
  coverage: string;
}>;
export type Snapshot = Readonly<{
  packages: readonly Readonly<{ name: string; version: string }>[];
  tag?: string;
  date?: string;
  url?: string;
  observed?: string;
}>;
