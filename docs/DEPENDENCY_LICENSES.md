# Dependency licenses

Generated from the prepared runtime inventory. This is a technical coverage
report, not a legal opinion. Re-run release preparation after package changes.

18 package/version records; 11 source origins; both target architectures.

Matching verified recipes, patches, upstream archives and complete copyright/license
evidence accompany the release and image. Sources are published before executables.

| Package | Version | License expression | Origin / build commit | Architecture |
| --- | --- | --- | --- | --- |
| alpine-baselayout | 3.7.2-r1 | GPL-2.0-only | alpine-baselayout / `60a7585bbab2fa0f762504eb617dbca90216e31f` | aarch64, x86_64 |
| alpine-baselayout-data | 3.7.2-r1 | GPL-2.0-only | alpine-baselayout / `60a7585bbab2fa0f762504eb617dbca90216e31f` | aarch64, x86_64 |
| alpine-keys | 2.6-r0 | MIT | alpine-keys / `b9f23becced4d7b3ccc0fa0f28530243ccd314a0` | aarch64, x86_64 |
| alpine-release | 3.24.3-r0 | MIT | alpine-base / `ee92350c8a4509152dc91c693814215a884c07c3` | aarch64, x86_64 |
| apk-tools | 3.0.8-r0 | GPL-2.0-only | apk-tools / `4588b452722bd4800efdc6cce4f6e980e02a997f` | aarch64, x86_64 |
| busybox | 1.37.0-r31 | GPL-2.0-only | busybox / `c3ef5d10e6ef6528852c51f0564963e2f8c1be19` | aarch64, x86_64 |
| busybox-binsh | 1.37.0-r31 | GPL-2.0-only | busybox / `c3ef5d10e6ef6528852c51f0564963e2f8c1be19` | aarch64, x86_64 |
| ca-certificates-bundle | 20261020-r0 | MPL-2.0 AND MIT | ca-certificates / `e78f5987166c6ffbe23f6472e2e8f040298fe2da` | aarch64, x86_64 |
| libapk | 3.0.8-r0 | GPL-2.0-only | apk-tools / `4588b452722bd4800efdc6cce4f6e980e02a997f` | aarch64, x86_64 |
| libcrypto3 | 3.5.9-r0 | Apache-2.0 | openssl / `29b9ec24b1b5b39aeef51fa2a044210e2ec5258e` | aarch64, x86_64 |
| libgcc | 15.2.0-r5 | GPL-2.0-or-later AND LGPL-2.1-or-later | gcc / `423a8ad043d07f2c7546c8ec3e2b0384cda360ae` | aarch64, x86_64 |
| libssl3 | 3.5.9-r0 | Apache-2.0 | openssl / `29b9ec24b1b5b39aeef51fa2a044210e2ec5258e` | aarch64, x86_64 |
| libstdc++ | 15.2.0-r5 | GPL-2.0-or-later AND LGPL-2.1-or-later | gcc / `423a8ad043d07f2c7546c8ec3e2b0384cda360ae` | aarch64, x86_64 |
| musl | 1.2.6-r3 | MIT | musl / `8f79d39391b46d6dbf1800fb68b8212a21d5ee2e` | aarch64, x86_64 |
| musl-utils | 1.2.6-r3 | MIT AND BSD-2-Clause AND GPL-2.0-or-later | musl / `8f79d39391b46d6dbf1800fb68b8212a21d5ee2e` | aarch64, x86_64 |
| scanelf | 1.3.9-r1 | GPL-2.0-only | pax-utils / `c61801eeacb3ffcd9c2025b09e402153bb93fb39` | aarch64, x86_64 |
| ssl_client | 1.37.0-r31 | GPL-2.0-only | busybox / `c3ef5d10e6ef6528852c51f0564963e2f8c1be19` | aarch64, x86_64 |
| zlib | 1.3.2-r1 | Zlib | zlib / `0afa2da0e8c8051c6f8f64a7a388e5a259904245` | aarch64, x86_64 |

## Node.js runtime

Node.js v24.21.0: checksum-verified complete upstream sources and bundled notices.
The Node notices are also shipped as node-LICENSE.txt.

## Production npm dependencies

Complete installed JavaScript sources, retained licenses and lockfile provenance
accompany the release. Development dependencies are excluded from the runtime.

| Package | Version | License |
| --- | --- | --- |
| @root/acme | 3.1.0 | MPL-2.0 |
| @root/asn1 | 1.0.2 | MPL-2.0 |
| @root/csr | 0.8.1 | MPL-2.0 |
| @root/encoding | 1.0.1 | MPL-2.0 |
| @root/keypairs | 0.10.3 | MPL-2.0 |
| @root/pem | 1.0.4 | MPL-2.0 |
| @root/request | 1.9.2 | (MIT OR Apache-2.0) |
| @root/x509 | 0.7.2 | MPL-2.0 |
| @types/root__asn1 | 1.0.5 | MIT |
| httpxy | 0.5.5 | MIT |

Certlivo own files are Apache-2.0. Third-party files retain their licenses.
The source helper, scanner and test CA are build/test tools, not runtime components.
