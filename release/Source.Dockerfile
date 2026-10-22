# Copyright 2026 Oliver Weinrich
# SPDX-License-Identifier: Apache-2.0
FROM node:24.21.0-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1
RUN apk upgrade --no-cache && apk add --no-cache bash abuild curl grep tar xz zstd
WORKDIR /tools
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund \
    && rm -rf /usr/local/lib/node_modules /opt/yarn* /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn* /usr/local/bin/docker-entrypoint.sh
COPY scripts/ ./scripts/
COPY release/ ./release/
COPY tests/tooling/release/ ./tests/tooling/release/
ENTRYPOINT ["node", "release/collect-sources.ts"]
