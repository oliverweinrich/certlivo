# Agent guide for Certlivo

Confirm this repository, `git status --short`, current branch and VERSION first.
Preserve user edits. Do not commit, tag, push, deploy or publish merely to test.
Use English Conventional Commit subjects and `feat/`, `fix/`, `docs/`, `ci/`,
`build/`, `test/` or `chore/` branches with kebab-case descriptions.

Read README.md, examples/CONFIGURATION.md, SECURITY.md and .github/README.md.
Do not expose personal deployments or local workspace paths in project files.

## Structure

- One root package.json and package-lock.json manage runtime and development dependencies.
- src/: strict TypeScript configuration, HTTP, certificate, state and runtime modules.
- scripts/: TypeScript build, inventory, scanning, cleanup and CI tools.
- tests/unit/: runtime tests mirroring src/; compiled separately into .test-dist/.
- tests/tooling/: release, scripts and GitHub automation tests and permission fixtures.
- tests/integration/: HTTP/TLS clients, backend fixtures and isolated Pebble integration.
- release/: TypeScript source/license collection, validation and publication.
- image/Dockerfile: pinned Node builder and runtime; build context is the repository root.
- licenses/third-party/: retained upstream license texts and Node notices.
- licenses/generated/: ignored release-specific evidence; .gitkeep preserves the build input.
- build/legal/: generated image notices assembled from canonical root/docs/license files.
- .github/: pinned Actions/scanner, TypeScript maintenance tools and native workflows.
- docs/, examples/: architecture, versioning and the supported configuration contract.

Keep Docker's root .dockerignore and release/package-project.ts allowlists in sync.
Never include .env files, private keys, deployment state, caches or host node_modules.
Do not introduce a second project package manifest.

## Engineering

Own code is functional TypeScript: no classes/inheritance, this, switch, any,
default exports or console logging. Use explicit returns, validated boundaries,
readonly types, small functions and central structured logging. Public module
APIs use named exports from index.ts. No import cycles; target 80 and maximum
200 lines per own TypeScript file. Tests assert behavior rather than mirror implementation.

Node 24 executes tooling TypeScript directly. tsc compiles the gateway into dist/.
tsconfig.json, tsconfig.tools.json and tsconfig.tests.json are strict. ESLint's configuration
requires a default export; Docker RUN directives and the two one-line Husky
launchers are native tool integration. Own orchestration remains TypeScript.
External Alpine APKBUILD recipes are shell programs run only inside the source helper.
Third-party class instances are confined to infrastructure/test adapters.

## Validation

```sh
npm ci --ignore-scripts --no-audit
npm run format:check
npm run lint
npm run typecheck
npm test
npm audit --audit-level=high
docker build --build-arg VERSION="$(cat VERSION)" -t "certlivo:$(cat VERSION)" -f image/Dockerfile .
npm run test:integration
npm run scan -- "certlivo:$(cat VERSION)"
git diff --check
```

Run actionlint after workflow changes. Test both architectures on native runners.
Integration tests use disposable containers, networks, volumes and test-only CA
trust. Never use production ACME, live certificate volumes or public reporting
channels for test credentials. All fixtures must clean up after success and failure.

## Runtime invariants

Ports 80/443 are fixed. Host/path routes share one process; static file targets
and proxy targets coexist. TLS settings must agree per hostname. Unknown names
fail closed. Docker DNS resolves again after upstream replacement. Preserve URI,
API authorization/body semantics and safe forwarded identity headers. No implicit
path rewriting, proxy cache or automatic mutation retry. Block hidden files,
symlinks and directory listings in mounted sites.

Use the ACME/CSR library and native TLS/crypto rather than implementing these
protocols. Preserve bounded retries, atomic snapshots, host/key/validity checks
and served-fingerprint verification. Review the hash-pinned MPL compatibility
patch when updating ACME. The HTTPS transport permits only the issuer origin.
The Node process retains a flock descriptor for exclusive /data ownership.
CLI health/status/renew use a private Unix socket, never a public admin port.

## Release and cleanup

VERSION and the root manifest/lock version must agree. New immutable published
versions are never overwritten. A merge alone never publishes. Matching tags
trigger source preparation, a multiarch candidate, native acceptance, then
public sources before that unchanged runtime. Never rebuild after testing.
Untrusted checks receive no Docker Hub write credentials.

Keep LICENSE, NOTICE and THIRD_PARTY_NOTICES.md canonical at the root.
npm run legal:stage assembles byte-identical image copies into ignored build/legal/.
Verified recipes, patches, OS/Node/npm sources, notices and SBOMs must match
actual images. Scanner/source checks are technical evidence, not legal certainty.
Fresh Alpine packages require scheduled builds in addition to Dependabot.
Never restore prepared output, certificate data or publication approvals from caches.

npm run clean removes generated build/report/legal staging. Add --releases or
--cache explicitly for local prepared outputs or download caches. Never delete
license texts, Git state, deployment volumes or shared Docker images as cleanup.
