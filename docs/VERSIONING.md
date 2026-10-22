# Versioning

VERSION is authoritative and must match the root package.json, package-lock.json
and its root package entry. Run `npm run version:set -- X.Y.Z` to synchronize
these files, README and Compose image references. Review and merge before tagging
vX.Y.Z. Versioning starts at 1.0.0; a merge alone does not publish.

Compatible fixes and dependency refreshes use patch versions; compatible features
use minor versions. Breaking route, ENV or state changes require a major version
and documented migration behavior. Pin image versions in deployments. Changing
ACME issuer requires separate state.

Published version tags, images and source archives are immutable. Release uses
one checksummed candidate across native AMD64/ARM64 acceptance jobs. Publication
loads that candidate and never rebuilds the runtime. If publication partially
fails, inspect existing registry tags and GitHub assets before retrying. Prefer
a new corrected version to replacing public artifacts.
