# Copyright 2026 Oliver Weinrich
# SPDX-License-Identifier: Apache-2.0
FROM node:26.12.0-alpine@sha256:6f08a523443ddedf52941874c203475b0ad503e859ad70cb26ab8be9a517dbd5
RUN apk upgrade --no-cache && apk add --no-cache bash abuild curl grep tar xz zstd
WORKDIR /tools
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund \
    && rm -rf /usr/local/lib/node_modules /opt/yarn* /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn* /usr/local/bin/docker-entrypoint.sh
COPY scripts/ ./scripts/
COPY release/ ./release/
COPY tests/tooling/release/ ./tests/tooling/release/
ENTRYPOINT ["node", "release/collect-sources.ts"]
