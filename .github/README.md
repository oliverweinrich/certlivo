# Maintenance and publication

Dependabot opens weekly Docker, Compose, Actions and npm updates. One root
package-lock.json covers both runtime and development dependencies. Alpine
packages resolve during refreshed builds and need scheduled scans. No automatic
merge is configured; merging never publishes an image.

TypeScript versions >=6.1.0 are temporarily excluded from Dependabot updates:
typescript-eslint 8.72.0 supports >=4.8.4 <6.1.0. Revisit this limit when the lint
tooling supports newer compilers. Other dependency updates remain enabled.
Keep peer-dependency checks active rather than bypassing them with --force or
--legacy-peer-deps.

## Repository setup

Enable Actions, Issues, Dependabot alerts/security updates and private vulnerability
reporting. Require `Check (amd64)` and `Check (arm64)` in main's branch ruleset
after their first successful run. YAML does not configure repository settings.

Create a protected `dockerhub` environment whose deployment rules allow main and
v* release tags. Configure DOCKERHUB_USERNAME and optionally DOCKERHUB_REPOSITORY
(default oliverweinrich/certlivo). Add a Read/Write DOCKERHUB_TOKEN secret.
DOCKERHUB_OVERVIEW_TOKEN is separate and needs the current Overview API permissions
(Read/Write/Delete). It is used only for metadata, never image login/push.
The built-in GITHUB_TOKEN publishes release assets; no personal token is needed.

Checks and untrusted PRs receive no registry credentials. Only the protected
publication job has image-write credentials and repository contents write.
The scheduled notification job separately has issues write. Do not run untrusted
PR code with privileged pull_request_target workflows.

## Checks

PR, main, manual and Monday 05:17 UTC runs execute formatting, strict TypeScript,
ESLint, tests/unit/ and tests/tooling/ tests and npm audit; refresh/build runtime and helper images;
test real HTTP-01/renewal, HTTP/TLS APIs, WebSockets and static sites; compare
actual package inventories and scan HIGH/CRITICAL vulnerabilities.

Native AMD64 and ARM64 jobs upload separate maintenance reports. Scheduled/manual
runs on main update one maintenance issue with failures, package changes and
known vulnerabilities. A confirmed registry 404 permits the initial unpublished
comparison; authentication, rate-limit and network failures fail the check.

Own workflow orchestration is TypeScript in scripts/ and .github/. npm audit
remains a required check; service errors are failures, not vulnerability results.
`npm run dependencies:report` is offline. `npm run dependencies` can retrieve the
latest published inventory. The dependency reporter can also update its snapshot
offline with `node .github/dependencies.ts --offline --write`. DEPENDENCIES.md is
a snapshot, not an update lockfile.

## Publication

Run `npm run version:set -- X.Y.Z`, review and merge tested changes. A matching
vX.Y.Z tag in main history or manual dispatch on main triggers:

1. Validate version/ref, prepare matching sources/notices and scan the helper.
2. Build one multiarch candidate, compare its source/license evidence, scan each
   platform and generate/checksum SPDX SBOMs.
3. Export that candidate and test it on native AMD64 and ARM64 runners.
4. Restore the same candidate in the protected environment and check unused tags.
5. Publish matching source/license archives, inventories, checksums and SBOMs on
   GitHub, verify public availability, then publish the sources image and runtime.
6. Update and verify the Docker Hub overview using separate metadata credentials.

`npm run release:prepare`, `npm run release:check -- --local` and
`npm run release:publish -- --check` expose the individual TypeScript gates.
`npm run release:publish` writes public releases/images and is reserved for the
protected workflow. Source preparation alone never publishes. A release marker
cannot be overwritten; use a new version or separate CERTLIVO_RELEASE_DIR.

Downloads are cached by recipe commit or Node version and verified again on use.
Prepared output, private state and approvals are never cached. Node runtime and
source-helper image declarations are pinned independently. Sources include exact
Alpine build inputs, complete upstream Node sources and production npm source
files, including the documented MPL compatibility patches. Publication refuses
missing evidence. Source availability must outlive temporary Actions artifacts.

`npm run dockerhub:preview` renders the actual versioned examples with commit-pinned
source links. The manual overview workflow retries metadata only and requires
VERSION to match published latest. Its API tests mock every write.

License texts are retained in licenses/third-party/. Release preparation stages
verified per-release evidence under licenses/generated/. The Docker builder
assembles build/legal/ from these inputs, the canonical root notices and
docs/DEPENDENCY_LICENSES.md; the assembled folder is never maintained by hand.
