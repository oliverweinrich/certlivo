# Copyright 2026 Oliver Weinrich
# SPDX-License-Identifier: Apache-2.0
FROM --platform=$BUILDPLATFORM node:24.21.0-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY tsconfig.json tsconfig.tests.json eslint.config.mjs ./
COPY src/ ./src/
COPY scripts/patch-acme.ts scripts/stage-legal.ts scripts/lib.ts ./scripts/
COPY tests/unit/ ./tests/unit/
COPY licenses/ ./licenses/
COPY LICENSE NOTICE THIRD_PARTY_NOTICES.md ./
COPY docs/DEPENDENCY_LICENSES.md ./docs/DEPENDENCY_LICENSES.md
RUN npm run build && npm run test:app && npm run legal:stage

FROM build AS production
COPY scripts/npm-notices.ts scripts/lib.ts ./scripts/
RUN npm prune --omit=dev --ignore-scripts --no-audit --no-fund \
    && node scripts/npm-notices.ts /app /legal/npm

FROM node:24.21.0-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS runtime
RUN apk upgrade --no-cache \
    && addgroup -g 10001 certlivo && adduser -D -H -u 10001 -G certlivo certlivo \
    && mkdir -p /data && chown 10001:10001 /data \
    && rm -rf /usr/local/lib/node_modules /opt/yarn* /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn* /usr/local/bin/docker-entrypoint.sh
WORKDIR /app
COPY --from=production /app/package.json /app/package-lock.json ./
COPY --from=production /app/dist/ ./dist/
COPY --from=production /app/node_modules/ ./node_modules/
COPY --from=build /app/build/legal/ /usr/share/licenses/certlivo/
COPY --from=production /legal/npm/ /usr/share/licenses/certlivo/npm/
COPY scripts/inventory.ts scripts/hash-runtime.ts /usr/local/share/certlivo/
RUN chmod 755 /app/dist/main.js \
    && ln -s /app/dist/main.js /usr/local/bin/certlivo \
    && node /usr/local/share/certlivo/inventory.ts > /usr/share/licenses/certlivo/packages.tsv \
    && node --version > /usr/share/licenses/certlivo/node-version \
    && node /usr/local/share/certlivo/hash-runtime.ts > /usr/share/licenses/certlivo/runtime-files.sha256
ARG VERSION=dev
LABEL org.opencontainers.image.title="Certlivo" \
      org.opencontainers.image.description="TypeScript reverse proxy and static server with automatic ACME HTTPS" \
      org.opencontainers.image.version="$VERSION" \
      org.opencontainers.image.source="https://github.com/oliverweinrich/certlivo" \
      org.opencontainers.image.authors="Oliver Weinrich" \
      org.opencontainers.image.licenses="Apache-2.0 AND LicenseRef-ThirdParty"
USER 10001:10001
EXPOSE 80 443
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 CMD ["/usr/local/bin/certlivo", "healthcheck"]
ENTRYPOINT ["/usr/local/bin/certlivo"]
CMD []

FROM scratch AS release-sources
COPY --from=runtime /usr/share/licenses/certlivo/ /licenses/
COPY --from=runtime /usr/share/licenses/certlivo/packages.tsv /packages.tsv
COPY --from=runtime /usr/share/licenses/certlivo/runtime-files.sha256 /runtime-files.sha256
COPY --from=runtime /usr/share/licenses/certlivo/node-version /node-version
COPY --from=production /app/package.json /app/package-lock.json /npm/
COPY --from=production /app/node_modules/ /npm/node_modules/

FROM runtime AS final
