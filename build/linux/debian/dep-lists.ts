/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Based on https://source.chromium.org/chromium/chromium/src/+/main:chrome/installer/linux/debian/additional_deps
// Additional dependencies not in the dpkg-shlibdeps output.
export const additionalDeps = [
	'ca-certificates', // Make sure users have SSL certificates.
	'libgtk-3-0 (>= 3.9.10) | libgtk-4-1',
	'libnss3 (>= 3.26)',
	'libcurl3-gnutls | libcurl3-nss | libcurl4 | libcurl3', // For Breakpad crash reports.
	'xdg-utils (>= 1.0.2)', // OS integration
];

// Based on https://source.chromium.org/chromium/chromium/src/+/main:chrome/installer/linux/debian/manual_recommends
// Dependencies that we can only recommend
// for now since some of the older distros don't support them.
export const recommendedDeps = [
	'libvulkan1', // Move to additionalDeps once support for Trusty and Jessie are dropped.
	'bubblewrap', // agent command sandboxing
	'socat', // agent command sandboxing
];

// NOTE (Nexgile fork): the amd64 list below is re-baselined against what THIS
// repo's CI actually produces, and no longer matches upstream's.
//
// Upstream compiles the native modules inside a build container pinned to an old
// glibc/gcc; .github/workflows/build-linux.yml compiles them on the runner
// (ubuntu-22.04 for x64, ubuntu-24.04-arm for arm64) and installs libkrb5-dev,
// so the .node files reference newer symbol versions and link Kerberos. That
// legitimately produces dependencies upstream's build never emits:
//
//   libstdc++6 (>= 5|6|9)         native modules built with the runner's gcc
//   libc6 (>= 2.29)               ditto, raising the floor from upstream's 2.28
//   libgssapi-krb5-2 (>= 1.17)    the kerberos module against libkrb5-dev
//   libkrb5-3 (>= 1.6.dfsg.2)     ditto
//   libcups2 (>= 1.6.0)
//
// The effective floor is therefore Ubuntu 20.04 / Debian 11. Debian 10 (glibc
// 2.28, libstdc++ 8) can no longer install the package. If an older floor is
// ever required, the fix is to build the native modules in an old-glibc
// container as upstream does — NOT to trim entries from this list, which only
// disables the review tripwire while the package keeps requiring them.
//
// Upstream's comment in debian/calculate-deps.ts claims Kerberos dependencies
// are filtered out; they are not — that filter only drops libgcc-s1. The
// comment is stale upstream, not fork drift.
//
// arm64 is likewise re-baselined, from the ubuntu-24.04-arm runner. It needed
// fewer changes than amd64 because upstream's arm64 list already carried
// libstdc++6 (>= 9); it gained the same libc6 (>= 2.29), cups and Kerberos
// entries, and dropped two libstdc++6 constraints subsumed by the rest.
//
// armhf below is still upstream's, unverified against this CI.
export const referenceGeneratedDepsByArch = {
	'amd64': [
		'ca-certificates',
		'libasound2 (>= 1.0.17)',
		'libatk-bridge2.0-0 (>= 2.5.3)',
		'libatk1.0-0 (>= 2.11.90)',
		'libatspi2.0-0 (>= 2.9.90)',
		'libc6 (>= 2.14)',
		'libc6 (>= 2.15)',
		'libc6 (>= 2.17)',
		'libc6 (>= 2.25)',
		'libc6 (>= 2.28)',
		'libc6 (>= 2.29)',
		'libc6 (>= 2.4)',
		'libcairo2 (>= 1.6.0)',
		'libcups2 (>= 1.6.0)',
		'libcurl3-gnutls | libcurl3-nss | libcurl4 | libcurl3',
		'libdbus-1-3 (>= 1.9.14)',
		'libexpat1 (>= 2.1~beta3)',
		'libgbm1 (>= 17.1.0~rc2)',
		'libglib2.0-0 (>= 2.39.4)',
		'libgssapi-krb5-2 (>= 1.17)',
		'libgtk-3-0 (>= 3.9.10)',
		'libgtk-3-0 (>= 3.9.10) | libgtk-4-1',
		'libkrb5-3 (>= 1.6.dfsg.2)',
		'libnspr4 (>= 2:4.9-2~)',
		'libnss3 (>= 2:3.30)',
		'libnss3 (>= 3.26)',
		'libpango-1.0-0 (>= 1.14.0)',
		'libstdc++6 (>= 5)',
		'libstdc++6 (>= 6)',
		'libstdc++6 (>= 9)',
		'libudev1 (>= 183)',
		'libx11-6',
		'libx11-6 (>= 2:1.4.99.1)',
		'libxcb1 (>= 1.9.2)',
		'libxcomposite1 (>= 1:0.4.4-1)',
		'libxdamage1 (>= 1:1.1)',
		'libxext6',
		'libxfixes3',
		'libxkbcommon0 (>= 0.5.0)',
		'libxkbfile1 (>= 1:1.1.0)',
		'libxrandr2',
		'xdg-utils (>= 1.0.2)'
	],
	'armhf': [
		'ca-certificates',
		'libasound2 (>= 1.0.17)',
		'libatk-bridge2.0-0 (>= 2.5.3)',
		'libatk1.0-0 (>= 2.11.90)',
		'libatspi2.0-0 (>= 2.9.90)',
		'libc6 (>= 2.16)',
		'libc6 (>= 2.17)',
		'libc6 (>= 2.25)',
		'libc6 (>= 2.28)',
		'libc6 (>= 2.4)',
		'libc6 (>= 2.9)',
		'libcairo2 (>= 1.6.0)',
		'libcurl3-gnutls | libcurl3-nss | libcurl4 | libcurl3',
		'libdbus-1-3 (>= 1.9.14)',
		'libexpat1 (>= 2.1~beta3)',
		'libgbm1 (>= 17.1.0~rc2)',
		'libglib2.0-0 (>= 2.39.4)',
		'libgtk-3-0 (>= 3.9.10)',
		'libgtk-3-0 (>= 3.9.10) | libgtk-4-1',
		'libnspr4 (>= 2:4.9-2~)',
		'libnss3 (>= 2:3.30)',
		'libnss3 (>= 3.26)',
		'libpango-1.0-0 (>= 1.14.0)',
		'libstdc++6 (>= 4.1.1)',
		'libstdc++6 (>= 5)',
		'libstdc++6 (>= 5.2)',
		'libstdc++6 (>= 6)',
		'libstdc++6 (>= 9)',
		'libudev1 (>= 183)',
		'libx11-6',
		'libx11-6 (>= 2:1.4.99.1)',
		'libxcb1 (>= 1.9.2)',
		'libxcomposite1 (>= 1:0.4.4-1)',
		'libxdamage1 (>= 1:1.1)',
		'libxext6',
		'libxfixes3',
		'libxkbcommon0 (>= 0.5.0)',
		'libxkbfile1 (>= 1:1.1.0)',
		'libxrandr2',
		'xdg-utils (>= 1.0.2)'
	],
	'arm64': [
		'ca-certificates',
		'libasound2 (>= 1.0.17)',
		'libatk-bridge2.0-0 (>= 2.5.3)',
		'libatk1.0-0 (>= 2.11.90)',
		'libatspi2.0-0 (>= 2.9.90)',
		'libc6 (>= 2.17)',
		'libc6 (>= 2.25)',
		'libc6 (>= 2.28)',
		'libc6 (>= 2.29)',
		'libcairo2 (>= 1.6.0)',
		'libcups2 (>= 1.6.0)',
		'libcurl3-gnutls | libcurl3-nss | libcurl4 | libcurl3',
		'libdbus-1-3 (>= 1.9.14)',
		'libexpat1 (>= 2.1~beta3)',
		'libgbm1 (>= 17.1.0~rc2)',
		'libglib2.0-0 (>= 2.39.4)',
		'libgssapi-krb5-2 (>= 1.17)',
		'libgtk-3-0 (>= 3.9.10)',
		'libgtk-3-0 (>= 3.9.10) | libgtk-4-1',
		'libkrb5-3 (>= 1.6.dfsg.2)',
		'libnspr4 (>= 2:4.9-2~)',
		'libnss3 (>= 2:3.30)',
		'libnss3 (>= 3.26)',
		'libpango-1.0-0 (>= 1.14.0)',
		'libstdc++6 (>= 5)',
		'libstdc++6 (>= 6)',
		'libstdc++6 (>= 9)',
		'libudev1 (>= 183)',
		'libx11-6',
		'libx11-6 (>= 2:1.4.99.1)',
		'libxcb1 (>= 1.9.2)',
		'libxcomposite1 (>= 1:0.4.4-1)',
		'libxdamage1 (>= 1:1.1)',
		'libxext6',
		'libxfixes3',
		'libxkbcommon0 (>= 0.5.0)',
		'libxkbfile1 (>= 1:1.1.0)',
		'libxrandr2',
		'xdg-utils (>= 1.0.2)'
	]
};
