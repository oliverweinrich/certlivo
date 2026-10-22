// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
export type Route = Readonly<{
  host: string;
  path: string;
  target: string;
  tls: boolean;
  kind: 'proxy' | 'static';
}>;
export type Host = Readonly<{ name: string; tls: boolean }>;
export type Config = Readonly<{
  routes: readonly Route[];
  hosts: readonly Host[];
  email: string;
  directory: string;
  environment: 'production' | 'staging';
  data: string;
  headerSize: number;
  upstreamSize: number;
  bodySize: number;
  accessLog: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}>;
export type GetEnv = (key: string) => string;
