# Certlivo

An environment-configured TypeScript gateway running on Node.js. Configure
multiple hosts, mounted sites and HTTP upstreams in one container,
with automatic HTTPS per host. Own code is licensed under Apache-2.0.

```yaml
services:
  certlivo:
    image: oliverweinrich/certlivo:1.0.0
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    environment:
      ACME_EMAIL: admin@example.com
      ACME_AGREE_TOS: 'true'
      ROUTES_JSON: |-
        [
          {"host":"api.example.com","path":"/","target":"http://api:3000","tls":true}
        ]
  api:
    image: ${API_IMAGE:?Set your API image listening on port 3000}
    restart: unless-stopped
```

Set your domain, email and API image. DNS must point to this host and inbound
80/443 must be reachable. The API listens on `0.0.0.0:3000`; Compose resolves
`api` internally, without publishing the API's port. Certificate setup runs
automatically. To serve files directly, mount
`./website:/sites/website:ro` and use `"target":"file:///sites/website"` in a route.
Static sites and proxy routes can share the same host; see the
[mixed routes example](examples/compose.routes.yaml).

TLS is selected per host. Proxy routes preserve path and query; `/api/users` remains
`/api/users`. `tls=false` serves HTTP only. Methods, API bodies and authentication
headers are forwarded; CORS and permissions remain the backend's responsibility.
Response caching and automatic request replay are disabled. HTTPS upstreams
are verified separately from the public HTTPS connection.

Certificate state is optional persistent data. Without a volume, certificates
are requested automatically and renewed while the container exists. Replacing
the container loses state and requires issuance again, subject to CA availability
and rate limits. For upgrades, add a named volume mounted at `/data`; no manual
certificate preparation is needed. Run as UID/GID 10001 with Docker's default
unprivileged-port support; `/data` bind mounts must be writable by that identity.
Static content mounts only need read and directory traversal permissions.

The controller checks certificates at startup and roughly every twelve hours,
with bounded retries after errors. Validated certificates are activated through
Node.js TLS contexts without restarting the gateway. A valid certificate keeps HTTPS running through CA
outages. Health reports local gateway readiness, not public reachability or
upstream application availability.

- [Configuration and limits](examples/CONFIGURATION.md)
- [Multiple hosts and path routes](examples/compose.routes.yaml)
- [Internal API example](examples/compose.api.yaml)
- [Development and agent guide](AGENTS.md)
- [Maintenance and release setup](.github/README.md)
- [Versioning](docs/VERSIONING.md) and [architecture](docs/ARCHITECTURE.md)
- [Dependencies](DEPENDENCIES.md) and [security](SECURITY.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md) and [dependency licenses](docs/DEPENDENCY_LICENSES.md)

Node.js supplies HTTP/TLS, `httpxy` handles reverse proxying and `@root/acme`
implements ACME. Certlivo owns configuration, routing, safe static serving,
certificate scheduling and activation. The root package.json and package-lock.json manage runtime and development dependencies.
Build and release tools and integration fixtures are also TypeScript.
Tests are grouped in tests/unit/, tests/tooling/ and tests/integration/.
Upstream license texts live in licenses/third-party/; the build assembles image
notices automatically from the canonical root files and generated release evidence.
README and examples/CONFIGURATION.md describe the supported behavior.

Releasing requires matching sources, notices, inventories, SBOMs and native
AMD64/ARM64 tests. Do not distribute a development image merely because it has
a version label. See [publication requirements](.github/README.md#publication).

Development requires Node 24 and Docker:

```sh
npm ci --ignore-scripts --no-audit
npm run lint
npm run typecheck
npm test
docker build --build-arg VERSION="$(cat VERSION)" -t "certlivo:$(cat VERSION)" -f image/Dockerfile .
npm run test:integration
```

`npm run clean` removes generated build/report/legal staging. Add `-- --releases
--cache` explicitly to remove local prepared outputs, exported candidates and downloaded source caches.
Certificate volumes, project licenses and shared Docker images are not deleted.
