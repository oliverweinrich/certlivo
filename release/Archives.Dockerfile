# Copyright 2026 Oliver Weinrich
# SPDX-License-Identifier: Apache-2.0
FROM scratch
ARG VERSION
LABEL org.opencontainers.image.title="Certlivo source and license archives" \
      org.opencontainers.image.version="$VERSION" \
      org.opencontainers.image.authors="Oliver Weinrich" \
      org.opencontainers.image.source="https://github.com/oliverweinrich/certlivo" \
      org.opencontainers.image.description="Source-only image. Extract /sources with docker create and docker cp; do not run." \
      org.opencontainers.image.licenses="Apache-2.0 AND LicenseRef-ThirdParty"
COPY *.tar.gz *.spdx.json packages.tsv npm-packages.json node-version SHA256SUMS Dockerfile /sources/
CMD ["/sources-only-do-not-run"]
