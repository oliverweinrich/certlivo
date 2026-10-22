# Security

No independent security audit is claimed. Native CI scans runtime and release helper packages for known high/
critical findings, but a clean scan is not a guarantee of no vulnerabilities.

Do not publish secrets or certificate keys in issues. Use GitHub private
vulnerability reporting when enabled for oliverweinrich/certlivo. Until that
repository feature is configured, request a private reporting channel without
including exploit credentials or private deployment details in a public issue.

Use only trusted targets and configuration. State mounts must be writable by
UID/GID 10001. Mount public static content read-only under `/sites/`, readable
by that identity. Hidden paths and symbolic links are blocked; all other readable
files within a static target can be public, including backups or source files.
Mounts should not expose unrelated host data. Keep /data backups
private. No Docker socket or privileged container is needed. Public hostnames
on certificates can appear in Certificate Transparency logs. Access logs are
opt-in and may contain personal data; retention is the operator's responsibility.

HTTP-only routes are intentionally unencrypted. TLS to the public gateway and
TLS to an upstream are separate choices. Authentication, authorization, CORS and
private response cache headers belong to the application. The proxy overwrites
forwarded identity headers and does not trust arbitrary client-supplied values.

No analytics, tracking or runtime config downloads are included. The configured
ACME CA is contacted for certificate management; its terms must be accepted by
the operator. Do not use a test CA or untrusted CA bundle in production.
