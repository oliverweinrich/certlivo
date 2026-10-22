// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
export const nextCheck = (
  renewAt: number,
  now: number,
  jitter: number,
): number => {
  const maximumInterval = 12 * 3600000 + jitter;
  const minimumInterval = 30000;
  return (
    now + Math.min(maximumInterval, Math.max(minimumInterval, renewAt - now))
  );
};
