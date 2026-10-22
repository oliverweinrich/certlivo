// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
export type Level = 'debug' | 'info' | 'warn' | 'error';
const ranks = { debug: 0, info: 1, warn: 2, error: 3 };
export type Log = (
  level: Level,
  message: string,
  fields?: Readonly<Record<string, string | number | boolean>>,
) => void;
export const createLog =
  (minimum: Level): Log =>
  (level, message, fields = {}): void => {
    if (ranks[level] < ranks[minimum]) return;
    process.stderr.write(JSON.stringify({ level, message, ...fields }) + '\n');
  };
