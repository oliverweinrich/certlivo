# Dependencies

Generated with `npm run dependencies`. This snapshot is not an update lockfile.
The manifests and each release inventory are authoritative.

“Last pin change” is the UTC commit date of the declaration, not the upstream publication date.
Uncommitted lines and missing history are identified explicitly.

## Images

| Dependency                 | Configured version / pin              | Last pin change          | Source                            | Dependabot / maintenance |
| -------------------------- | ------------------------------------- | ------------------------ | --------------------------------- | ------------------------ |
| node                       | 24.21.0-alpine (sha256:ebfe2f904627…) | Unknown (no Git history) | `image/Dockerfile`                | Yes (docker; weekly)     |
| aquasec/trivy              | 0.76.0 (sha256:2416d1f74045…)         | Unknown (no Git history) | `.github/scanner/Dockerfile`      | Yes (docker; weekly)     |
| ghcr.io/letsencrypt/pebble | latest (sha256:ddf230642b1a…)         | Unknown (no Git history) | `tests/integration/ca/Dockerfile` | Yes (docker; weekly)     |
| node                       | 24.21.0-alpine (sha256:ebfe2f904627…) | Unknown (no Git history) | `release/Source.Dockerfile`       | Yes (docker; weekly)     |

## Example images

| Dependency              | Configured version / pin                           | Last pin change          | Source                         | Dependabot / maintenance     |
| ----------------------- | -------------------------------------------------- | ------------------------ | ------------------------------ | ---------------------------- |
| oliverweinrich/certlivo | 1.0.0                                              | Unknown (no Git history) | `examples/compose.api.yaml`    | Excluded; release-managed    |
| ${API_IMAGE             | ?Set the image of your API listening on port 3000} | Unknown (no Git history) | `examples/compose.api.yaml`    | Yes (docker-compose; weekly) |
| oliverweinrich/certlivo | 1.0.0                                              | Unknown (no Git history) | `examples/compose.routes.yaml` | Excluded; release-managed    |
| nginx                   | 1.31.7-alpine                                      | Unknown (no Git history) | `examples/compose.routes.yaml` | Yes (docker-compose; weekly) |
| ${API_IMAGE             | ?Set the image of your API listening on port 3000} | Unknown (no Git history) | `examples/compose.routes.yaml` | Yes (docker-compose; weekly) |

## Development npm

| Dependency                                         | Configured version / pin | Last pin change          | Source              | Dependabot / maintenance                             |
| -------------------------------------------------- | ------------------------ | ------------------------ | ------------------- | ---------------------------------------------------- |
| @cacheable/memory (transitive)                     | 2.2.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @cacheable/utils (transitive)                      | 2.5.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @eslint-community/eslint-utils (transitive)        | 4.10.1                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| eslint-visitor-keys (transitive)                   | 3.4.3                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @eslint-community/regexpp (transitive)             | 4.12.2                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @eslint/config-array (transitive)                  | 0.23.5                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @eslint/config-helpers (transitive)                | 0.7.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @eslint/core (transitive)                          | 1.2.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @eslint/js (direct)                                | 10.0.1                   | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |
| @eslint/object-schema (transitive)                 | 3.0.5                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @eslint/plugin-kit (transitive)                    | 0.7.3                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @humanfs/core (transitive)                         | 0.19.2                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @humanfs/node (transitive)                         | 0.16.8                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @humanfs/types (transitive)                        | 0.15.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @humanwhocodes/module-importer (transitive)        | 1.0.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @humanwhocodes/retry (transitive)                  | 0.4.3                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @keyv/bigmap (transitive)                          | 1.3.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @keyv/serialize (transitive)                       | 1.1.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @peculiar/asn1-cms (transitive)                    | 2.11.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @peculiar/asn1-csr (transitive)                    | 2.11.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @peculiar/asn1-ecc (transitive)                    | 2.11.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @peculiar/asn1-pfx (transitive)                    | 2.11.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @peculiar/asn1-pkcs8 (transitive)                  | 2.11.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @peculiar/asn1-pkcs9 (transitive)                  | 2.11.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @peculiar/asn1-rsa (transitive)                    | 2.11.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @peculiar/asn1-schema (transitive)                 | 2.11.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @peculiar/asn1-x509 (transitive)                   | 2.11.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @peculiar/asn1-x509-attr (transitive)              | 2.11.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @peculiar/utils (transitive)                       | 2.0.3                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @peculiar/x509 (direct)                            | 2.0.0                    | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |
| @types/esrecurse (transitive)                      | 4.3.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @types/estree (transitive)                         | 1.0.9                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @types/json-schema (transitive)                    | 7.0.15                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @types/node (direct)                               | 24.10.0                  | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |
| @types/tar-stream (direct)                         | 3.1.5                    | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |
| @typescript-eslint/eslint-plugin (transitive)      | 8.72.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| ignore (transitive)                                | 7.0.13                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @typescript-eslint/parser (transitive)             | 8.72.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @typescript-eslint/project-service (transitive)    | 8.72.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @typescript-eslint/scope-manager (transitive)      | 8.72.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @typescript-eslint/tsconfig-utils (transitive)     | 8.72.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @typescript-eslint/type-utils (transitive)         | 8.72.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @typescript-eslint/types (transitive)              | 8.72.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @typescript-eslint/typescript-estree (transitive)  | 8.72.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @typescript-eslint/utils (transitive)              | 8.72.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @typescript-eslint/visitor-keys (transitive)       | 8.72.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| acorn (transitive)                                 | 8.19.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| acorn-jsx (transitive)                             | 5.3.2                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| ajv (transitive)                                   | 6.15.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| asn1js (transitive)                                | 3.1.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| b4a (transitive)                                   | 1.9.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| balanced-match (transitive)                        | 4.0.4                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| bare-events (transitive)                           | 2.9.2                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| bare-fs (transitive)                               | 4.8.4                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| bare-path (transitive)                             | 3.1.2                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| bare-stream (transitive)                           | 2.13.4                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| bare-url (transitive)                              | 2.5.5                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| brace-expansion (transitive)                       | 5.0.12                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| cacheable (transitive)                             | 2.5.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| cross-spawn (transitive)                           | 7.0.6                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| debug (transitive)                                 | 4.4.3                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| deep-is (transitive)                               | 0.1.4                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| escape-string-regexp (transitive)                  | 4.0.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| eslint (direct)                                    | 10.13.0                  | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |
| eslint-scope (transitive)                          | 9.1.2                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| eslint-visitor-keys (transitive)                   | 5.0.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| espree (transitive)                                | 11.2.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| esquery (transitive)                               | 1.7.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| esrecurse (transitive)                             | 4.3.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| estraverse (transitive)                            | 5.3.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| esutils (transitive)                               | 2.0.3                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| events-universal (transitive)                      | 1.0.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| fast-deep-equal (transitive)                       | 3.1.3                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| fast-fifo (transitive)                             | 1.3.2                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| fast-json-stable-stringify (transitive)            | 2.1.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| fast-levenshtein (transitive)                      | 2.0.6                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| fdir (transitive)                                  | 6.5.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| file-entry-cache (transitive)                      | 11.1.5                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| find-up (transitive)                               | 5.0.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| flat-cache (transitive)                            | 6.1.23                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| flatted (transitive)                               | 3.4.4                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| glob-parent (transitive)                           | 6.0.2                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| hashery (transitive)                               | 1.5.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| hookified (transitive)                             | 1.15.1                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| husky (direct)                                     | 9.1.7                    | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |
| ignore (transitive)                                | 5.3.2                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| imurmurhash (transitive)                           | 0.1.4                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| is-extglob (transitive)                            | 2.1.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| is-glob (transitive)                               | 4.0.3                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| isexe (transitive)                                 | 2.0.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| json-schema-traverse (transitive)                  | 0.4.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| json-stable-stringify-without-jsonify (transitive) | 1.0.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| keyv (transitive)                                  | 5.6.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| levn (transitive)                                  | 0.4.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| lint-staged (direct)                               | 17.6.0                   | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |
| locate-path (transitive)                           | 6.0.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| minimatch (transitive)                             | 10.2.6                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| ms (transitive)                                    | 2.1.3                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| natural-compare (transitive)                       | 1.4.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| optionator (transitive)                            | 0.9.4                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| p-limit (transitive)                               | 3.1.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| p-locate (transitive)                              | 5.0.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| path-exists (transitive)                           | 4.0.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| path-key (transitive)                              | 3.1.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| picomatch (transitive)                             | 4.0.7                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| prelude-ls (transitive)                            | 1.2.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| prettier (direct)                                  | 3.9.10                   | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |
| punycode (transitive)                              | 2.3.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| pvtsutils (transitive)                             | 1.3.6                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| pvutils (transitive)                               | 1.2.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| qified (transitive)                                | 0.10.1                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| hookified (transitive)                             | 2.2.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| reflect-metadata (direct)                          | 0.2.2                    | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |
| semver (transitive)                                | 7.8.5                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| shebang-command (transitive)                       | 2.0.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| shebang-regex (transitive)                         | 3.0.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| streamx (transitive)                               | 2.28.1                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| string-argv (transitive)                           | 0.3.2                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| tar-stream (direct)                                | 3.2.2                    | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |
| teex (transitive)                                  | 1.0.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| text-decoder (transitive)                          | 1.2.7                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| tinyexec (transitive)                              | 1.3.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| tinyglobby (transitive)                            | 0.2.17                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| ts-api-utils (transitive)                          | 2.5.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| tslib (transitive)                                 | 2.8.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| tsyringe (transitive)                              | 4.10.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| tslib (transitive)                                 | 1.14.1                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| type-check (transitive)                            | 0.4.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| typescript (direct)                                | 6.0.3                    | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |
| typescript-eslint (direct)                         | 8.72.0                   | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |
| undici-types (transitive)                          | 7.16.0                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| uri-js (transitive)                                | 4.4.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| which (transitive)                                 | 2.0.2                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| word-wrap (transitive)                             | 1.2.5                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| yaml (direct)                                      | 2.9.1                    | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |
| yocto-queue (transitive)                           | 0.1.0                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |

## Runtime npm

| Dependency                     | Configured version / pin | Last pin change          | Source              | Dependabot / maintenance                             |
| ------------------------------ | ------------------------ | ------------------------ | ------------------- | ---------------------------------------------------- |
| @root/acme (direct)            | 3.1.0                    | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |
| @root/asn1 (transitive)        | 1.0.2                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @root/csr (direct)             | 0.8.1                    | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |
| @root/encoding (transitive)    | 1.0.1                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @root/keypairs (transitive)    | 0.10.3                   | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @root/pem (transitive)         | 1.0.4                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @root/request (transitive)     | 1.9.2                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @root/x509 (transitive)        | 0.7.2                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| @types/root__asn1 (transitive) | 1.0.5                    | Unknown (no Git history) | `package-lock.json` | Yes (npm; weekly); lockfile/parent constraints apply |
| httpxy (direct)                | 0.5.5                    | Unknown (no Git history) | `package.json`      | Yes (npm; weekly)                                    |

## GitHub Actions

| Dependency                 | Configured version / pin | Last pin change          | Source                          | Dependabot / maintenance     |
| -------------------------- | ------------------------ | ------------------------ | ------------------------------- | ---------------------------- |
| actions/checkout           | v7.0.1 (3d3c42e5aac5…)   | Unknown (no Git history) | `.github/workflows/check.yml`   | Yes (github-actions; weekly) |
| actions/setup-node         | v7.1.0 (949feb2413d6…)   | Unknown (no Git history) | `.github/workflows/check.yml`   | Yes (github-actions; weekly) |
| docker/setup-buildx-action | v4.4.1 (f87e5991a6d7…)   | Unknown (no Git history) | `.github/workflows/check.yml`   | Yes (github-actions; weekly) |
| actions/upload-artifact    | v7.0.2 (cf430e030ddb…)   | Unknown (no Git history) | `.github/workflows/check.yml`   | Yes (github-actions; weekly) |
| actions/download-artifact  | v8.0.2 (9000827ccba6…)   | Unknown (no Git history) | `.github/workflows/check.yml`   | Yes (github-actions; weekly) |
| actions/github-script      | v9.0.0 (3a2844b7e9c4…)   | Unknown (no Git history) | `.github/workflows/check.yml`   | Yes (github-actions; weekly) |
| docker/setup-docker-action | v5.5.0 (2bf61fb9464c…)   | Unknown (no Git history) | `.github/workflows/release.yml` | Yes (github-actions; weekly) |
| docker/setup-qemu-action   | v4.4.0 (990126619549…)   | Unknown (no Git history) | `.github/workflows/release.yml` | Yes (github-actions; weekly) |
| actions/cache/restore      | v5 (caa296126883…)       | Unknown (no Git history) | `.github/workflows/release.yml` | Yes (github-actions; weekly) |
| actions/cache/save         | v5 (caa296126883…)       | Unknown (no Git history) | `.github/workflows/release.yml` | Yes (github-actions; weekly) |

## Toolchain

| Dependency    | Configured version / pin | Last pin change          | Source          | Dependabot / maintenance                                             |
| ------------- | ------------------------ | ------------------------ | --------------- | -------------------------------------------------------------------- |
| Node.js major | 24                       | Unknown (no Git history) | `.node-version` | Manual major upgrades; setup-node resolves patches within this major |

## Runtime OS packages

Dependabot tracks the Docker image pin and the central package-lock.json.
Scheduled builds refresh Alpine packages and scan actual image contents.

Offline report: published package versions are not fetched. Use packages.tsv
from the matching GitHub release or /usr/share/licenses/certlivo/ in that image.

## Source helper OS packages

The native maintenance artifact contains source-helper-packages.tsv.
Helper packages are separate from the runtime inventory.

## Coverage boundaries

- Runtime and source-helper Node images have separate pinned declarations.
- Alpine helper packages resolve at build time and are scanned independently.
- Certlivo image references in examples are release-managed by npm run version:set.
- .node-version and Node engine requirements need manual major-version review.
- Native runners, Docker, Git and optional actionlint follow their providers.
- Trivy refreshes its vulnerability database during scans.
- Repository security alerts and branch protections need GitHub settings.

Markdown inventories do not replace the architecture-specific SPDX SBOMs.

[Maintenance workflow](.github/README.md)
