# Configuration

Configure Certlivo through Compose environment variables. The Node.js gateway runs inside one container. Mount static content directly, forward to HTTP services, or combine both.
No Docker socket is needed.

| Variable                      | Default                                 | Contract                                                         |
| ----------------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| `ROUTES_JSON`                 | required                                | 1–128 objects: `host`, `path`, `target`, `tls`                   |
| `ACME_EMAIL`                  | required for TLS                        | Plain contact address                                            |
| `ACME_AGREE_TOS`              | false                                   | Set `true` explicitly to register for HTTPS                      |
| `ACME_ENV`                    | production                              | `production` or `staging`; separate state                        |
| `ACME_DIRECTORY_URL`          | Let's Encrypt directory for environment | Optional HTTPS ACME directory; endpoints must share its origin   |
| `CLIENT_HEADER_BUFFER_SIZE`   | 16k                                     | Per-field limit, max 128k; total header limit is four times this |
| `UPSTREAM_HEADER_BUFFER_SIZE` | 16k                                     | Response header buffer, at most 128k                             |
| `MAX_BODY_SIZE`               | 10m                                     | Request body limit, at most 1024m                                |
| `ACCESS_LOG`                  | off                                     | `on` enables access logs to stderr                               |
| `LOG_LEVEL`                   | info                                    | `debug`, `info`, `warn`, `error`                                 |

Sizes use positive integer `k` or `m` units. No unlimited size setting.
Unknown route fields and invalid/missing TLS booleans are rejected. Retired
`DOMAINS`, `SITE_MODE`, `UPSTREAM_URL` and `SITES_JSON` are rejected.

```json
[
  {
    "host": "example.com",
    "path": "/",
    "target": "file:///sites/website",
    "tls": true
  },
  {
    "host": "example.com",
    "path": "/api",
    "target": "http://api:3000",
    "tls": true
  },
  {
    "host": "legacy.example.com",
    "path": "/",
    "target": "http://legacy:8080",
    "tls": false
  }
]
```

Hosts are DNS names (ASCII/punycode), normalized to lowercase, without wildcards.
Every route for one host must use the same TLS setting. Duplicate host/path
pairs fail. Paths contain letters, numbers, slashes, hyphens and underscores.
The longest matching prefix wins: `/api` matches `/api` and `/api/users`, not
`/apix`. A trailing slash in the route is normalized for matching. No implicit
prefix stripping for proxy routes: `/api/users?x=1` reaches the same URI at the target.

Proxy targets are `http://` or `https://` plus hostname/IP and optional port, without
credentials, path, query or fragment. In Compose, use the service name and its
container port, e.g. `http://api:3000`. The backend listens on `0.0.0.0:3000`;
it needs no published host port. Certlivo resolves Docker service names again
when containers are replaced. Do not use localhost for another container.

Static targets use `file:///sites/<directory>` and a read-only content mount:

```yaml
volumes:
  - ./website:/sites/website:ro
environment:
  ROUTES_JSON: |-
    [{"host":"example.com","path":"/","target":"file:///sites/website","tls":false}]
```

The target is a directory inside the container, under `/sites/`. Directory names
use ASCII letters, digits, hyphens, underscores and dots, without hidden or
relative path components. Multiple mounts
and proxy routes can coexist; no extra route fields or environment variables are
needed. A static `/docs` route maps `/docs/page.html` to `<directory>/page.html`;
`/docs` redirects to `/docs/` preserving the query. Proxy routes preserve the
complete original URI. More specific routes such as `/api` take precedence.

Static serving supports GET/HEAD, `index.html`, MIME types, ETags, conditional
requests and byte ranges. Missing files return 404; directory listings, hidden
path components and symbolic links are blocked. No SPA fallback or script
execution is enabled. Browser caching uses ETag and Last-Modified validators without
an added expiry policy; proxy response caching remains disabled. Mount only
public files. Directories must be traversable and files readable by UID/GID 10001;
static content does not need write permission. Keep certificates and secrets
outside `/sites/`.

`tls=true` obtains a certificate per host and redirects HTTP to HTTPS with 308.
Until a valid certificate is active, that host returns 503 except for HTTP-01.
A TLS failure never silently exposes its API over HTTP. `tls=false` serves only
HTTP and does not request a certificate. Unknown HTTPS names are rejected.
HTTPS targets are independently verified with SNI and the system CA bundle.

GET, HEAD, POST, PUT, PATCH, DELETE and OPTIONS preserve method/body/query.
Backend authorization, cookies, CORS and caching headers remain the backend's
responsibility. Forwarded identity headers are overwritten with gateway-derived
values. TRACE/CONNECT tunnels are unsupported. Proxy response caching and
automatic upstream retries are disabled. WebSocket upgrades are forwarded;
SSE/streaming customization, custom timeouts and proxy-cache opt-in are not yet
supported. Idle proxy read/send timeouts are 60 seconds; connect timeout is 5s.

The certificate manager checks immediately and roughly every 12 hours with jitter. Failures
retry with bounded backoff. Successful renewals activate checked snapshots and
verify the served fingerprint. Status: `docker compose exec certlivo certlivo status`.

A changed ACME directory requires separate state.

A mount is optional. Without one, stopping/starting the same container retains
state, but replacing it requests certificates again and can hit CA rate limits.
Add `certificates:/data` to retain state across upgrades. Never share writable
state between active controllers. Bind mounts must be writable by UID/GID 10001;
new Docker volumes inherit the image directory ownership. Do not use `down -v`
for routine upgrades.

`docker compose exec certlivo certlivo renew` requests an immediate forced renewal for
configured HTTPS hosts. It uses the private control socket inside `/data/run/`;
there is no public administration endpoint. Use it for diagnostics rather than
routine renewal. Normal renewal is automatic and starts before the final third
of a certificate's lifetime (at most 30 days before expiry).

State is stored under `/data/node-acme/<environment>`. The supported import layout
is `/data/acme/<environment>/live/<host>/fullchain.pem` and `privkey.pem` with the
same directory identity. Valid pairs are checked and imported automatically;
source files remain intact. A new account key is created when issuance is needed.
Keep a private state backup before upgrading and keep the same ACME directory.
