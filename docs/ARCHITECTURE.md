# Architecture

Certlivo is one TypeScript gateway on Node.js. Native HTTP/TLS, filesystem and
crypto APIs provide the platform boundary. httpxy forwards HTTP/WebSocket traffic;
@root/acme and @root/csr provide ACME operations and CSR generation.

## Source and package layout

The root package.json and package-lock.json manage every project dependency.
Production packages are dependencies; compilers, linters, fixture certificate
generation and archive tooling are devDependencies. There are no npm workspaces
or nested project manifests. Runtime modules live in src/, tools in scripts/,
release/, .github/ and tests/. All own executable logic is TypeScript.

The gateway is compiled into dist/ and runs on the pinned Node 26 image.
Node 24 executes development and CI tooling TypeScript directly;
strict typechecks cover both groups. Runtime unit tests mirror src/ under
tests/unit/ and compile separately into .test-dist/ using tsconfig.tests.json.
Tooling tests live in tests/tooling/; Docker/Pebble fixtures live in tests/integration/. Named module APIs, bounded file size and
an acyclic import graph are checked automatically. ESLint's required configuration
export and native Git hook launchers are integration exceptions.

Docker builds from the repository root with an explicit .dockerignore allowlist.
The builder installs the central lockfile and compiles/tests the application.
The production stage removes development packages. The runtime contains Node,
compiled gateway code, production packages and licenses, running as UID/GID 10001.
The separate source helper includes Node and Alpine build/archive tools. Official
APKBUILD recipes require Bash and abuild; own collection logic is TypeScript.

## License material

LICENSE, NOTICE and THIRD_PARTY_NOTICES.md at the root are canonical.
licenses/third-party/ retains upstream license texts and Node bundled notices.
docs/DEPENDENCY_LICENSES.md is the generated component report. Release preparation
writes verified Alpine notices and release metadata into ignored licenses/generated/.
scripts/stage-legal.ts assembles these inputs into ignored build/legal/, both
locally and inside the Docker builder. The runtime receives that assembly under
/usr/share/licenses/certlivo/ plus the actual installed production npm notices.
Source archives retain all canonical inputs, and release checks reconstruct the
assembly to compare it with the accepted image. No manually mirrored notices
are maintained under image/.

## Routing and files

HTTP and HTTPS bind ports 80/443. Host and boundary-aware longest path prefix
select routes. Proxy targets preserve the original URI. Docker service names
resolve again on new connections. Untrusted forwarded metadata is replaced;
proxy caching, automatic replay and redirect following are disabled. Request
bodies, individual/total request headers and upstream response headers are bounded.

Static targets map prefix-relative paths into /sites directories. Hidden paths,
symlinks and directory listings are blocked. Linux descriptor validation protects
against a replaced parent directory. GET/HEAD support MIME types, ETags,
Last-Modified validators and byte ranges.

## Certificates and state

The ACME adapter uses HTTP-01 over an issuer-only HTTPS transport. Requests have
15-second deadlines and issuance has a two-minute deadline. Redirects and
cross-origin issuer endpoints are rejected. Local preflight is disabled; the
CA still validates its challenges. Library maintainer registration is disabled.

The pinned @root/acme distribution needs a compatibility fix: after finalization,
processing orders are polled at the order URL with an empty POST-as-GET. The
same patch skips already-valid authorizations and disables maintainer registration. scripts/patch-acme.ts verifies
original and modified SHA-256 hashes; upstream changes fail until reviewed.
scripts/patch-asn1.ts also preserves raw BIT STRING bytes in verbose parser trees,
including EC public points that happen to parse as nested ASN.1. Compact parser
output remains unchanged. Both patches verify original and modified hashes.
Modified upstream files remain MPL-2.0. Complete matching modified sources,
licenses and the patch script accompany releases. Certlivo files remain Apache-2.0.

Certificate host, key match and validity are checked before atomic private
persistence. SNI selects TLS contexts; unknown or unavailable names fail closed.
Activation verifies the locally served fingerprint. Valid HTTPS survives CA
outages. Renewal checks run at startup and at most roughly twelve-hour intervals,
shortened for short certificate lifetimes, with bounded failure backoff.

The Node process opens the lock file and passes its descriptor to flock for
locking, then keeps its own descriptor open. It stays PID 1 without a shell
supervisor. A private Unix socket provides health, status and forced renewal.
State identity binds an environment to one issuer. Optional /data persistence
affects replacement lifetime, not automatic issuance. Valid certificate pairs in
the supported legacy state layout can be imported without deleting their source.

## Releases

Preparation verifies exact Alpine recipes/patches/sources, checksum-verified
Node sources and complete production npm sources/notices against actual images.
The final candidate is checksummed, scanned and tested natively on AMD64/ARM64.
Public matching source assets precede executable image publication; the runtime
is never rebuilt after acceptance. Build caches retain downloads, not approvals,
private certificate state or completed release output.
