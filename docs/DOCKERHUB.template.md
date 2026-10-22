# Certlivo {{VERSION}}

TypeScript/Node.js reverse proxy and static server configured through environment variables.
Mounted static sites, HTTP backends, automatic HTTPS, optional certificate volume, no
Docker socket. Own code is Apache-2.0; bundled components keep their licenses.

[Project]({{PROJECT_URL}}) · [Configuration]({{SOURCE_URL}}/examples/CONFIGURATION.md)

## Multiple routes

{{SERVER_COMPOSE}}

## API service

{{CLIENT_COMPOSE}}

Set your domains, email and API image. Backend ports stay internal. Certlivo uses
80/443. Without optional /data persistence, container replacement reissues keys
and certificates and can hit CA rate limits. Use a volume for stable upgrades.

Sources and third-party licenses for {{REPOSITORY}}:{{VERSION}} and the matching
{{REPOSITORY}}:{{VERSION}}-sources image are distributed with the GitHub release.
Read [notices]({{SOURCE_URL}}/THIRD_PARTY_NOTICES.md) and
[configuration]({{SOURCE_URL}}/examples/CONFIGURATION.md) before deployment.
