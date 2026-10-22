# Third-party notices

Certlivo own code is Apache-2.0. The container aggregates separately licensed
software; it is not entirely relicensed under Apache-2.0.

The runtime contains Node.js and its bundled components, the production npm
packages locked in the root package-lock.json, and Alpine OS packages.
The Node distribution includes its own bundled license/copyright notices;
read node-LICENSE.txt in /usr/share/licenses/certlivo/.

The release process retains exact Alpine APKBUILD recipes, patches and verified
upstream sources. Matching upstream Node sources are verified against the
version's official SHASUMS256.txt. Production npm JavaScript distributions,
lockfile integrity values, package metadata and discovered license/copyright
files accompany the release. Native npm addons require separate source review.
The @root packages are MPL-2.0 JavaScript source modules. Certlivo modifies
@root/acme to poll finalized orders correctly, skip already-valid
authorizations and disable maintainer registration. The modifications retain MPL-2.0 and are identified in the file.
Their complete installed source files and MPL texts are included in the matching
source archive under npm/node_modules and in the -sources image. Certlivo
application files remain separately licensed under Apache-2.0.

No claim is made that published npm archives include their authors' original
TypeScript or repository history. Upstream license terms determine whether
additional source material is required.

License material is shipped under /usr/share/licenses/certlivo/. The generated
COMPONENTS.md and npm/INVENTORY.json identify the actual prepared dependencies.
Version-matching source and license archives, inventories, SBOMs and checksums
must be published before the runtime image, both on GitHub releases and through
the matching -sources image. Source availability must outlive temporary CI
artifact retention. Generic upstream links do not replace matching sources.

Development npm tools, test fixtures, the test CA, scanner and source helper are
not bundled into the production runtime. Their manifests accompany the project;
their upstream licenses continue to apply when downloaded. The host kernel is
not distributed in this container.

Node: https://github.com/nodejs/node/blob/main/LICENSE
ACME client (MPL-2.0): https://git.rootprojects.org/root/acme.js
HTTP proxy: https://github.com/unjs/httpxy
Alpine packages: https://pkgs.alpinelinux.org/

These notices describe the distribution process, not a legal opinion or a
statement of trademark clearance. Names identify upstream components; no
upstream logos, affiliation or endorsement are claimed.
