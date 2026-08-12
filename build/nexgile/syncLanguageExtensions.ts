/*---------------------------------------------------------------------------------------------
 *  Nexgile Code -- language-support built-in extension sync.
 *
 *  Resolves every entry in languageExtensions.json against the configured extension gallery,
 *  downloads each vsix through the exact URL and headers the build itself will use, records the
 *  sha256 of the exact bytes the build will see, and rewrites the managed block of product.json.
 *
 *  Usage:
 *    node build/nexgile/syncLanguageExtensions.ts            verify pins, fail on drift (CI mode)
 *    node build/nexgile/syncLanguageExtensions.ts --write     rewrite product.json
 *    node build/nexgile/syncLanguageExtensions.ts --write --update   re-resolve unpinned versions first
 *    node build/nexgile/syncLanguageExtensions.ts --only redhat.java,golang.go
 *--------------------------------------------------------------------------------------------*/

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const root = path.dirname(path.dirname(import.meta.dirname));
const manifestPath = path.join(import.meta.dirname, 'languageExtensions.json');
const productPath = path.join(root, 'product.json');
/** The fork's VS Code version lives in package.json, not product.json. */
const packagePath = path.join(root, 'package.json');
const noticesPath = path.join(root, 'ThirdPartyNotices-Extensions.txt');

/**
 * Publishers whose extensions are ours. Their licensing is governed by the product EULA, so they carry
 * no upstream notice obligation and are excluded from the generated attribution file.
 */
const FIRST_PARTY_PUBLISHERS = new Set(['nexgile']);

/** Marks a builtInExtensions entry as generated from the manifest, so a removed entry can be pruned. */
const MANAGED_KEY = 'nexgileManagedLanguageExtension';

/**
 * Byte-for-byte the headers `build/lib/extensions.ts` sends. The sha256 recorded here is only
 * meaningful if the request that produced it is identical to the one the build will make.
 */
const GALLERY_HEADERS: Record<string, string> = {
	'X-Market-Client-Id': 'VSCode Build',
	'User-Agent': 'VSCode Build',
	'X-Market-User-Id': '291C1CD0-051A-4123-9B4B-30D60EF52EE2'
};

const OPEN_VSX_API = 'https://open-vsx.org/api';

/**
 * Notice-only licenses: redistribution is permitted provided the copyright notice and license text
 * travel with the binary. That proviso is not optional -- shipping MIT code without its notice is a
 * license violation exactly as much as shipping proprietary code would be. `writeNotices` discharges it.
 */
const NOTICE_ONLY_LICENSES = new Set([
	'MIT',
	'Apache-2.0',
	'BSD-2-Clause',
	'BSD-3-Clause',
	'ISC',
	'0BSD',
	'Unlicense',
	'CC0-1.0'
]);

/**
 * Weak copyleft: redistribution is permitted, but modifications to the covered files must be published
 * and recipients must be told how to obtain the source. We do not modify these extensions, so the
 * obligation reduces to a written offer of source -- but that is still an obligation someone has to
 * actually honour, so the manifest must acknowledge it per-extension rather than inheriting it silently.
 */
const RECIPROCAL_LICENSES = new Set(['EPL-1.0', 'EPL-2.0', 'MPL-2.0', 'LGPL-2.1', 'LGPL-3.0', 'CDDL-1.0']);

/**
 * Diagnostic hints applied ONLY when the license could not be identified, to explain *why* it is being
 * refused rather than just that it was.
 *
 * These deliberately do not run against an identified license. A plain substring scan cannot be used as
 * a veto, because standard license texts quote each other: MPL-2.0 §1.12 defines "Secondary License" by
 * naming the GNU Affero General Public License, so scanning MPL-2.0 for "gnu affero" rejects a perfectly
 * redistributable package. Identification decides; these only describe.
 */
const REFUSAL_HINTS: { pattern: RegExp; reason: string }[] = [
	{ pattern: /business source license/i, reason: 'Business Source License is source-available, not open source' },
	{ pattern: /microsoft software license terms/i, reason: 'Microsoft marketplace terms permit use only with Microsoft products' },
	{ pattern: /non-?commercial/i, reason: 'contains a non-commercial restriction' },
	{ pattern: /(?:licen[cs]e key|activation key|paid licen[cs]e|premium licen[cs]e)/i, reason: 'refers to a paid or activation licence key' },
	{ pattern: /you may not (?:redistribute|sublicense|distribute)/i, reason: 'contains an explicit redistribution prohibition' },
	{ pattern: /all rights reserved/i, reason: 'asserts copyright without an evident grant of rights' }
];

/**
 * Approximate size of each canonical license text, used as a tripwire for files that contain a
 * recognised license *plus something else*.
 *
 * `bmewburn.vscode-intelephense-client` is the motivating case: its LICENSE opens with a verbatim MIT
 * grant covering the client, so identification alone says MIT and waves it through — but the file is
 * 4.7 KB against MIT's 1.1 KB, and the remainder covers a proprietary language server. Matching the
 * first recognisable license in a file is not the same as establishing the terms of the whole package.
 */
const CANONICAL_LICENSE_BYTES: Record<string, number> = {
	'0BSD': 800,
	ISC: 900,
	MIT: 1200,
	Unlicense: 1300,
	'BSD-2-Clause': 1400,
	'BSD-3-Clause': 1600,
	'CC0-1.0': 7500,
	'Apache-2.0': 11500,
	'EPL-1.0': 11500,
	'EPL-2.0': 14500,
	'MPL-2.0': 17000,
	'LGPL-2.1': 27000,
	'LGPL-3.0': 8000,
	'CDDL-1.0': 16000
};

/** How much longer than canonical a LICENSE may run before it must be read by a human. */
const LICENSE_LENGTH_TOLERANCE = 1.6;

/** Distinctive phrases used to identify what a LICENSE file actually is, independent of its metadata. */
const LICENSE_SIGNATURES: { id: string; pattern: RegExp }[] = [
	{ id: 'Apache-2.0', pattern: /apache license[\s\S]{0,40}version 2\.0/i },
	{ id: 'EPL-2.0', pattern: /eclipse public license\s*-?\s*v(?:ersion)?\s*2\.0/i },
	{ id: 'EPL-1.0', pattern: /eclipse public license\s*-?\s*v(?:ersion)?\s*1\.0/i },
	{ id: 'MPL-2.0', pattern: /mozilla public license[\s\S]{0,40}version 2\.0/i },
	{ id: 'AGPL-3.0', pattern: /gnu affero general public license/i },
	{ id: 'LGPL-3.0', pattern: /gnu lesser general public license[\s\S]{0,60}version 3/i },
	{ id: 'LGPL-2.1', pattern: /gnu lesser general public license[\s\S]{0,60}version 2\.1/i },
	{ id: 'GPL-3.0', pattern: /gnu general public license[\s\S]{0,60}version 3/i },
	{ id: 'GPL-2.0', pattern: /gnu general public license[\s\S]{0,60}version 2/i },
	{ id: 'BUSL-1.1', pattern: /business source license/i },
	{ id: 'Unlicense', pattern: /free and unencumbered software released into the public domain/i },
	// CC0 must be matched before the generic Creative Commons families: it is a public-domain dedication,
	// whereas CC-BY-SA carries a share-alike obligation that has no place in a redistributed binary.
	{ id: 'CC0-1.0', pattern: /cc0 1\.0 universal|creative commons zero/i },
	{ id: 'CC-BY-4.0', pattern: /creative commons attribution 4\.0/i },
	{ id: 'CC-BY-SA-4.0', pattern: /creative commons attribution-sharealike/i },
	{ id: 'ISC', pattern: /permission to use, copy, modify,? and\/or distribute/i },
	{ id: 'BSD-3-Clause', pattern: /redistributions of source code must retain[\s\S]{0,2000}neither the name/i },
	{ id: 'BSD-2-Clause', pattern: /redistributions of source code must retain/i },
	{ id: 'MIT', pattern: /permission is hereby granted, free of charge/i }
];

interface ManifestEntry {
	name: string;
	language: string;
	license: string;
	repo: string;
	publisherDisplayName?: string;
	version?: string;
	allowPreRelease?: boolean;
	serverDelivery?: 'bundled' | 'download' | 'external';
	/** Required for weak-copyleft licenses: confirms someone has actually put a source offer in place. */
	sourceOfferAcknowledged?: boolean;
	/** Required when the package vendors third-party code: confirms those licenses were read. */
	bundledLicensesReviewed?: boolean;
	notes?: string;
}

interface Manifest {
	extensions: ManifestEntry[];
}

interface BuiltInExtension {
	name: string;
	version: string;
	sha256: string;
	repo: string;
	platforms?: string[];
	vsix?: string;
	metadata: {
		id: string;
		publisherId: {
			publisherId: string;
			publisherName: string;
			displayName: string;
			flags: string;
		};
		publisherDisplayName: string;
	};
	[MANAGED_KEY]?: true;
	nexgileLanguage?: string;
	nexgileLicense?: string;
	nexgileServerDelivery?: string;
}

interface OpenVsxVersion {
	version: string;
	preRelease?: boolean;
	targetPlatform?: string;
	license?: string;
	engines?: { vscode?: string };
	displayName?: string;
	namespaceDisplayName?: string;
	allVersions?: Record<string, string>;
	files?: Record<string, string>;
	/** `publisher.name` ids this extension hard-requires; VS Code refuses to activate without them. */
	dependencies?: { namespace: string; extension: string }[];
}

interface ExtensionManifest {
	activationEvents?: string[];
	extensionDependencies?: string[];
	contributes?: Record<string, unknown>;
}

// -------------------------------------------------------------------------------------------------
// Small helpers
// -------------------------------------------------------------------------------------------------

function fail(message: string): never {
	console.error(`\x1b[31merror\x1b[0m ${message}`);
	process.exit(1);
}

function warn(message: string): void {
	console.warn(`\x1b[33mwarn\x1b[0m  ${message}`);
}

function info(message: string): void {
	console.log(`      ${message}`);
}

function splitId(name: string): { publisher: string; extension: string } {
	const index = name.indexOf('.');

	if (index <= 0 || index === name.length - 1) {
		fail(`"${name}" is not a valid publisher.extension id`);
	}

	return { publisher: name.slice(0, index), extension: name.slice(index + 1) };
}

/**
 * A deterministic UUIDv5 over the extension id.
 *
 * The gallery metadata block wants GUIDs, and Open VSX does not expose the marketplace ones. Deriving
 * them means a given extension gets the same identity on every machine and every rerun -- random GUIDs
 * would make product.json churn on each sync and would break identity across rebuilds.
 */
function deterministicUuid(namespace: string, value: string): string {
	const hash = crypto.createHash('sha1').update(`${namespace}:${value}`).digest();
	const bytes = Buffer.from(hash.subarray(0, 16));

	bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
	bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant

	const hex = bytes.toString('hex');

	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Every extension id the shipped product will contain: the ones compiled from `extensions/` plus every
 * entry in `builtInExtensions`. Used to tell a satisfiable `extensionDependencies` from a dangling one.
 */
function shippedExtensionIds(builtIn: BuiltInExtension[], manifest: Manifest): Set<string> {
	const ids = new Set<string>();

	for (const item of builtIn) {
		ids.add(item.name.toLowerCase());
	}

	for (const entry of manifest.extensions) {
		ids.add(entry.name.toLowerCase());
	}

	const extensionsDir = path.join(root, 'extensions');

	for (const dirent of fs.readdirSync(extensionsDir, { withFileTypes: true })) {
		if (!dirent.isDirectory()) {
			continue;
		}

		try {
			const pkg = JSON.parse(fs.readFileSync(path.join(extensionsDir, dirent.name, 'package.json'), 'utf8'));

			if (pkg.name) {
				ids.add(`${pkg.publisher ?? 'vscode'}.${pkg.name}`.toLowerCase());
			}
		} catch {
			// Not every directory under extensions/ is an extension (shared configs, build helpers).
		}
	}

	return ids;
}

async function getJson<T>(url: string): Promise<T | undefined> {
	const response = await fetch(url, { headers: { Accept: 'application/json' } });

	if (response.status === 404) {
		return undefined;
	}

	if (!response.ok) {
		fail(`GET ${url} -> ${response.status} ${response.statusText}`);
	}

	return (await response.json()) as T;
}

// -------------------------------------------------------------------------------------------------
// Resolution
// -------------------------------------------------------------------------------------------------

/** Upper bound on versions pulled per extension. Chatty CI publishers have hundreds. */
const MAX_VERSIONS = 300;
const PAGE_SIZE = 100;

/**
 * Every published version of an extension, newest first, with the metadata needed to choose between them.
 *
 * Deliberately the bulk `/-/query` route rather than `/latest` plus a walk. `/latest` returns whichever
 * package was published most recently regardless of pre-release status *or* target platform, so choosing
 * from it means one HTTP round trip per rejected candidate -- and Red Hat's extensions publish enough
 * dated CI pre-releases to bury the newest stable more than a hundred entries deep. One paged query
 * returns a hundred fully-described versions at a time and makes the choice a local filter.
 */
async function listVersions(publisher: string, extension: string): Promise<OpenVsxVersion[]> {
	const versions: OpenVsxVersion[] = [];
	let offset = 0;
	let total = Infinity;

	while (versions.length < Math.min(total, MAX_VERSIONS)) {
		const url =
			`${OPEN_VSX_API}/-/query?namespaceName=${encodeURIComponent(publisher)}` +
			`&extensionName=${encodeURIComponent(extension)}&includeAllVersions=true` +
			`&size=${PAGE_SIZE}&offset=${offset}`;

		const page = await getJson<{ extensions?: OpenVsxVersion[]; totalSize?: number }>(url);
		const batch = page?.extensions ?? [];

		if (batch.length === 0) {
			break;
		}

		versions.push(...batch);
		total = page?.totalSize ?? versions.length;
		offset += batch.length;
	}

	return versions;
}

function isUniversal(version: OpenVsxVersion): boolean {
	return !version.targetPlatform || version.targetPlatform === 'universal';
}

/**
 * Whether a version is a pre-release, by the registry flag *or* by its own version string.
 *
 * The flag alone is not enough. `GraphQL.vscode-graphql` publishes `0.13.6-alpha.0` with
 * `preRelease: false`, because the flag reflects which channel the publisher uploaded to, not what the
 * semver says. Trusting it would ship an alpha as the pinned stable release.
 */
function isPreRelease(version: OpenVsxVersion): boolean {
	return Boolean(version.preRelease) || /-(?:alpha|beta|rc|next|dev|canary|pre)\b/i.test(version.version);
}

/**
 * Picks the version to pin, preferring a stable `universal` package.
 *
 * Two constraints, both non-negotiable. `builtInExtensions` pins one sha256 for every build target, so a
 * per-platform package is unusable -- `sumneko.lua` publishes `darwin-arm64` as its newest and would
 * otherwise put a macOS binary in a Windows installer. And a pre-release CI build is not something to
 * ship to customers by default.
 *
 * The warning matters as much as the selection: an extension that moved to per-platform packaging usually
 * abandoned its universal build at that moment. sumneko.lua's newest universal is 2.5.3 against a
 * platform-specific 3.19.0. Shipping it is a decision about how stale a server you will accept, and that
 * decision belongs in the sync output rather than buried in a lockfile.
 */
async function resolveVersion(entry: ManifestEntry): Promise<OpenVsxVersion> {
	const { publisher, extension } = splitId(entry.name);

	if (entry.version) {
		const base = `${OPEN_VSX_API}/${encodeURIComponent(publisher)}/${encodeURIComponent(extension)}`;
		const pinned = await getJson<OpenVsxVersion>(`${base}/${encodeURIComponent(entry.version)}`);

		if (!pinned) {
			fail(`${entry.name}: pinned version ${entry.version} does not exist on Open VSX`);
		}

		return pinned;
	}

	const versions = await listVersions(publisher, extension);

	if (versions.length === 0) {
		fail(`${entry.name}: not published on Open VSX`);
	}

	const stableUniversal = versions.find(version => !isPreRelease(version) && isUniversal(version));
	const newestStable = versions.find(version => !isPreRelease(version));

	if (stableUniversal) {
		if (newestStable && newestStable.version !== stableUniversal.version) {
			warn(
				`${entry.name}: pinning universal ${stableUniversal.version}, but the newest stable build is ` +
				`${newestStable.version} (${newestStable.targetPlatform}). The universal package is behind -- ` +
				`confirm it is still a server worth shipping.`
			);
		}

		return stableUniversal;
	}

	const preReleaseUniversal = versions.find(isUniversal);

	if (entry.allowPreRelease && preReleaseUniversal) {
		warn(`${entry.name}: no stable release on Open VSX, pinning pre-release ${preReleaseUniversal.version} as configured.`);
		return preReleaseUniversal;
	}

	const newest = versions[0];
	const capped = versions.length >= MAX_VERSIONS ? ` (search capped at ${MAX_VERSIONS}; an older universal build may exist)` : '';

	fail(
		`${entry.name}: no stable universal release in the newest ${versions.length} version(s)${capped}. ` +
		`Newest is ${newest.version}, target ${newest.targetPlatform ?? 'unknown'}, ` +
		`preRelease=${isPreRelease(newest)}. ` +
		`Pin an explicit "version", set "allowPreRelease": true, or drop this extension.`
	);
}

/**
 * Downloads through the gallery URL the build uses and hashes exactly what the build will hash.
 *
 * `build/lib/fetch.ts` checksums `Buffer.from(await response.arrayBuffer())`, i.e. the body *after*
 * transparent Content-Encoding decoding. Hashing the file from any other endpoint -- notably the
 * `files.download` URL in the API response -- can produce a different digest and a build that fails
 * on every machine but the one that generated the pin.
 */
async function downloadAndHash(
	name: string,
	version: string,
	serviceUrl: string
): Promise<{ sha256: string; bytes: number; contents: Buffer }> {
	const { publisher, extension } = splitId(name);
	const url = `${serviceUrl}/publishers/${publisher}/vsextensions/${extension}/${version}/vspackage`;
	const response = await fetch(url, { headers: GALLERY_HEADERS });

	if (!response.ok) {
		fail(`${name}@${version}: gallery returned ${response.status} for ${url}`);
	}

	const contents = Buffer.from(await response.arrayBuffer());

	if (contents.length < 4 || contents[0] !== 0x50 || contents[1] !== 0x4b) {
		fail(`${name}@${version}: gallery response is not a zip archive (${contents.length} bytes)`);
	}

	return { sha256: crypto.createHash('sha256').update(contents).digest('hex'), bytes: contents.length, contents };
}

/**
 * Splices a re-serialized array into product.json's raw text, in place.
 *
 * Round-tripping the whole file through `JSON.parse`/`JSON.stringify` would work, but it would also
 * expand every hand-formatted inline object in the file (`win32ContextMenu`, the onboarding entries)
 * onto separate lines, burying the one block that actually changed under hundreds of cosmetic lines.
 */
function spliceJsonArray(source: string, property: string, value: unknown[]): string {
	const key = `"${property}"`;
	const keyIndex = source.indexOf(key);

	if (keyIndex === -1) {
		fail(`product.json has no "${property}" key to update.`);
	}

	const open = source.indexOf('[', keyIndex + key.length);

	if (open === -1) {
		fail(`product.json's "${property}" is not an array.`);
	}

	let depth = 0;
	let inString = false;
	let escaped = false;
	let close = -1;

	for (let i = open; i < source.length; i++) {
		const char = source[i];

		if (escaped) {
			escaped = false;
			continue;
		}

		if (inString) {
			if (char === '\\') {
				escaped = true;
			} else if (char === '"') {
				inString = false;
			}

			continue;
		}

		if (char === '"') {
			inString = true;
		} else if (char === '[' || char === '{') {
			depth++;
		} else if (char === ']' || char === '}') {
			depth--;

			if (depth === 0) {
				close = i;
				break;
			}
		}
	}

	if (close === -1) {
		fail(`Could not find the end of "${property}" in product.json.`);
	}

	// The array lives one level deep, so every line but the first needs an extra tab.
	const serialized = JSON.stringify(value, undefined, '\t').split('\n').join('\n\t');

	return source.slice(0, open) + serialized + source.slice(close + 1);
}

function detectLicense(text: string): string | undefined {
	return LICENSE_SIGNATURES.find(signature => signature.pattern.test(text))?.id;
}

/** A license text a human verified and checked in, for packages that ship without one. */
function vendoredLicense(extensionId: string): string | undefined {
	const file = path.join(import.meta.dirname, 'licenses', `${extensionId}.txt`);

	return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : undefined;
}

/**
 * A grant of rights vendored alongside third-party code. These must be identified and cleared -- they
 * are the terms under which that code may be redistributed.
 */
const EMBEDDED_LICENSE_PATTERN = /(?:^|\/)(?:licen[cs]es?|copying)(?:[-._][^/]*)?(?:\.(?:txt|md|rst|html))?$/i;

/**
 * An attribution *document* rather than a grant: NOTICE, THIRDPARTYNOTICES and friends.
 *
 * These are deliberately not adjudicated. They are prose, and running license detection over them
 * produces confident nonsense -- Microsoft's standard `thirdpartynotices.txt` boilerplate carries a
 * clause about reverse-engineering LGPL libraries, which a keyword scan reads as "this package bundles
 * LGPL code" when it means nothing of the sort, and that file ships in every vscode-jsonrpc-derived
 * package. Blocking on it would make the check something people route around. They are counted and
 * reported so the information is not lost, and the adjacent LICENSE files carry the actual terms.
 */
const EMBEDDED_NOTICE_PATTERN = /(?:^|\/)(?:notices?|third-?party-?notices?)(?:[-._][^/]*)?(?:\.(?:txt|md|rst|html))?$/i;

/**
 * Lists the entries in a zip without decompressing anything.
 *
 * Only the central directory is parsed, which stores every filename in plain bytes, so this stays cheap
 * even on a 54 MB package. Reads backwards from the end for the End Of Central Directory record, then
 * walks the fixed-layout headers it points at.
 */
interface ZipEntry {
	name: string;
	method: number;
	compressedSize: number;
	localHeaderOffset: number;
}

function listZipEntries(buffer: Buffer): ZipEntry[] | undefined {
	const EOCD_SIGNATURE = 0x06054b50;
	const CENTRAL_SIGNATURE = 0x02014b50;

	// The EOCD is last, but a trailing comment of up to 64 KB may follow it.
	let eocd = -1;

	for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 22 - 0xffff); i--) {
		if (buffer.readUInt32LE(i) === EOCD_SIGNATURE) {
			eocd = i;
			break;
		}
	}

	if (eocd === -1) {
		return undefined;
	}

	const count = buffer.readUInt16LE(eocd + 10);
	const offset = buffer.readUInt32LE(eocd + 16);

	// ZIP64 sentinels. Rather than misparse a large archive, report "unknown" and let the caller warn.
	if (count === 0xffff || offset === 0xffffffff) {
		return undefined;
	}

	const entries: ZipEntry[] = [];
	let cursor = offset;

	for (let i = 0; i < count; i++) {
		if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== CENTRAL_SIGNATURE) {
			return undefined;
		}

		const nameLength = buffer.readUInt16LE(cursor + 28);
		const extraLength = buffer.readUInt16LE(cursor + 30);
		const commentLength = buffer.readUInt16LE(cursor + 32);

		entries.push({
			name: buffer.toString('utf8', cursor + 46, cursor + 46 + nameLength),
			method: buffer.readUInt16LE(cursor + 10),
			compressedSize: buffer.readUInt32LE(cursor + 20),
			localHeaderOffset: buffer.readUInt32LE(cursor + 42)
		});

		cursor += 46 + nameLength + extraLength + commentLength;
	}

	return entries;
}

/** Inflates one entry. The local header repeats the name and extra-field lengths, which can differ. */
function readZipEntry(buffer: Buffer, entry: ZipEntry): string | undefined {
	try {
		const header = entry.localHeaderOffset;
		const nameLength = buffer.readUInt16LE(header + 26);
		const extraLength = buffer.readUInt16LE(header + 28);
		const start = header + 30 + nameLength + extraLength;
		const raw = buffer.subarray(start, start + entry.compressedSize);

		return (entry.method === 0 ? raw : zlib.inflateRawSync(raw)).toString('utf8');
	} catch {
		return undefined;
	}
}

/**
 * The package's own top-level license, read out of the archive.
 *
 * Open VSX's `files.license` only reports what its indexer recognised at publish time, and it misses
 * files it did not expect -- so an absent `files.license` is evidence about the registry, not proof that
 * the package carries no license. Checking the archive itself before refusing avoids rejecting a
 * perfectly licensed extension over a metadata gap.
 */
function rootLicenseFromVsix(vsix: Buffer): string | undefined {
	const entries = listZipEntries(vsix);

	if (!entries) {
		return undefined;
	}

	const root = entries.find(entry => {
		const relative = entry.name.replace(/^extension\//, '');

		return !relative.includes('/') && /^licen[cs]e(?:[-._][^/]*)?(?:\.(?:txt|md|rst))?$/i.test(relative);
	});

	return root ? readZipEntry(vsix, root)?.trim() : undefined;
}

/**
 * Surfaces third-party code vendored *inside* a package.
 *
 * Establishing that an extension is MIT says nothing about what it bundles. `zobo.php-intellisense` is
 * MIT and ships a composer dependency under OSL-3.0, a reciprocal license; nothing in the extension's
 * own LICENSE hints at that. The installer redistributes vendored code just as literally as extension
 * code, so its terms bind too.
 *
 * This cannot adjudicate those terms automatically, and pretending otherwise would be worse than not
 * checking at all. What it does is refuse to let vendored licenses pass unnoticed: the entries are
 * listed, and the manifest has to record that a human actually read them.
 */
function checkBundledLicenses(entry: ManifestEntry, vsix: Buffer): void {
	const entries = listZipEntries(vsix);

	if (!entries) {
		warn(`${entry.name}: could not read the package index, so bundled third-party licenses were not checked.`);
		return;
	}

	// Anything nested is third-party; the root license is verifyLicense's business.
	const nested = entries.filter(zipEntry => zipEntry.name.replace(/^extension\//, '').includes('/'));
	const embedded = nested.filter(zipEntry => EMBEDDED_LICENSE_PATTERN.test(zipEntry.name));
	const noticeCount = nested.filter(zipEntry => EMBEDDED_NOTICE_PATTERN.test(zipEntry.name)).length;

	if (embedded.length === 0) {
		if (noticeCount > 0) {
			info(`${entry.name}: ${noticeCount} vendored attribution notice(s), no vendored license grants.`);
		}

		return;
	}

	// Classify rather than escalate. A bundled JS extension routinely vendors forty-odd node_modules
	// licenses, essentially all MIT or ISC; demanding a human sign-off on every one of those would make
	// the check something people wave through, which is worse than not having it. Only the entries that
	// are actually reciprocal, unidentifiable, or disqualifying are worth a person's attention.
	const escalate: string[] = [];
	const cleared = new Map<string, number>();

	for (const zipEntry of embedded) {
		const text = readZipEntry(vsix, zipEntry);
		const detected = text ? detectLicense(text) : undefined;

		if (detected && NOTICE_ONLY_LICENSES.has(detected)) {
			cleared.set(detected, (cleared.get(detected) ?? 0) + 1);
			continue;
		}

		const hint = text && REFUSAL_HINTS.find(({ pattern }) => pattern.test(text));

		escalate.push(
			`${zipEntry.name} -- ${detected ?? 'unidentified'}${hint ? ` (${hint.reason})` : ''}`
		);
	}

	const summary = [...cleared.entries()].map(([id, count]) => `${count}x ${id}`).join(', ');

	const noticeSuffix = noticeCount > 0 ? ` plus ${noticeCount} attribution notice(s)` : '';

	if (escalate.length === 0) {
		info(`${entry.name}: ${embedded.length} vendored license(s), all notice-only (${summary})${noticeSuffix}.`);
		return;
	}

	if (entry.bundledLicensesReviewed) {
		warn(`${entry.name}: ${escalate.length} vendored license(s) need attention, marked reviewed in the manifest.`);
		return;
	}

	const shown = escalate.slice(0, 12);

	fail(
		`${entry.name}: vendors third-party code whose terms bind this redistribution as much as the ` +
		`extension's own license does. ${embedded.length} vendored license(s) found` +
		`${summary ? ` (${summary} cleared automatically)` : ''}, but these need a human:\n` +
		shown.map(line => `        ${line}`).join('\n') +
		(escalate.length > shown.length ? `\n        ... and ${escalate.length - shown.length} more` : '') +
		`\n      Read them, then set "bundledLicensesReviewed": true and record what you found in "notes".`
	);
}

/**
 * Establishes redistribution rights from the LICENSE text that actually ships inside the vsix.
 *
 * Every check here is fatal rather than advisory, because a warning in a build log is not a defence.
 * Three independent sources have to agree -- what the manifest claims, what Open VSX's metadata says,
 * and what the packaged LICENSE file actually is -- and the packaged text is the one that governs.
 * Open VSX's `license` field is self-declared by the publisher and is regularly wrong or missing.
 *
 * An extension with no packaged LICENSE is refused outright. Not because it is necessarily unlicensed,
 * but because notice-only licenses require reproducing a copyright notice we would not have, so the
 * obligation could not be discharged even if the grant existed.
 */
async function verifyLicense(entry: ManifestEntry, resolved: OpenVsxVersion, vsix: Buffer): Promise<string> {
	const licenseUrl = resolved.files?.license;
	let text: string | undefined;

	if (licenseUrl) {
		const response = await fetch(licenseUrl);

		if (response.ok) {
			text = await response.text();
		}
	}

	// The registry's index is not the package. Fall back to the archive, then to a reviewed copy on disk,
	// in descending order of authority: what the registry indexed, what actually shipped, what a human
	// verified and checked in.
	text ??= rootLicenseFromVsix(vsix);
	text ??= vendoredLicense(entry.name);

	if (!text) {
		fail(
			`${entry.name}@${resolved.version}: neither the registry nor the package itself carries a ` +
			`LICENSE. Redistribution requires reproducing a copyright notice that does not exist here -- ` +
			`pin a version that packages one, or add the verified upstream text at ` +
			`build/nexgile/licenses/${entry.name}.txt.`
		);
	}

	const detected = detectLicense(text);

	if (!detected) {
		const hint = REFUSAL_HINTS.find(({ pattern }) => pattern.test(text));

		fail(
			`${entry.name}: the packaged LICENSE does not match any known license` +
			`${hint ? ` and ${hint.reason}` : ''}. It must be reviewed by hand before this extension can ship.`
		);
	}

	// A recognised license at the top of the file does not establish the terms of the whole file.
	const canonical = CANONICAL_LICENSE_BYTES[detected];

	if (canonical && text.length > canonical * LICENSE_LENGTH_TOLERANCE) {
		const hint = REFUSAL_HINTS.find(({ pattern }) => pattern.test(text));

		fail(
			`${entry.name}: the packaged LICENSE reads as ${detected} but runs ${text.length} bytes against ` +
			`a canonical ~${canonical}, so it carries additional terms beyond that grant` +
			`${hint ? ` (it ${hint.reason})` : ''}. Read it in full before shipping this extension.`
		);
	}

	if (detected !== entry.license) {
		fail(
			`${entry.name}: the manifest declares ${entry.license} but the packaged LICENSE reads as ` +
			`${detected}. The packaged text governs -- correct the manifest, or drop the extension.`
		);
	}

	if (resolved.license && resolved.license !== detected) {
		warn(
			`${entry.name}: Open VSX metadata says ${resolved.license}, packaged LICENSE says ${detected}. ` +
			`Proceeding on the packaged text, which is authoritative.`
		);
	}

	if (RECIPROCAL_LICENSES.has(detected)) {
		if (!entry.sourceOfferAcknowledged) {
			fail(
				`${entry.name}: ${detected} is weak copyleft. Redistributing it obliges you to tell recipients ` +
				`how to obtain the covered source. Set "sourceOfferAcknowledged": true once the offer is in ` +
				`place (the upstream repo URL in the notices file satisfies it for unmodified code).`
			);
		}

		return text;
	}

	if (!NOTICE_ONLY_LICENSES.has(detected)) {
		fail(`${entry.name}: ${detected} is not cleared for redistribution in a commercial product.`);
	}

	return text;
}

/**
 * Per-target vsix variants cannot be expressed here.
 *
 * `builtInExtensions` pins one version and one sha256 for every platform the fork builds, and the
 * `platforms` field filters on the *build host*, not the target. An extension that only publishes
 * per-target packages would install a Linux server binary into a Windows build.
 */
function checkTargetPlatform(entry: ManifestEntry, resolved: OpenVsxVersion): void {
	const target = resolved.targetPlatform;

	if (target && target !== 'universal') {
		fail(
			`${entry.name}@${resolved.version}: Open VSX resolved target platform "${target}", not "universal". ` +
			`A single pinned sha256 cannot serve every build target -- drop this extension or pin a universal build.`
		);
	}
}

/**
 * Guards the two failure modes that only appear once the built-in list gets long.
 *
 * A built-in extension cannot be uninstalled or disabled by the user, so an eagerly-activating one is
 * paid for on every single window open by every single user, whether or not they ever touch that
 * language. One is tolerable; forty is a visibly slower editor. Language extensions should activate on
 * `onLanguage:` and nothing else.
 *
 * The second is harder to spot: `extensionDependencies` are resolved at activation, and a built-in whose
 * dependency was never shipped fails silently -- the user sees a language with no features and no error
 * that explains why.
 */
async function checkActivationAndDependencies(
	entry: ManifestEntry,
	resolved: OpenVsxVersion,
	shipped: Set<string>
): Promise<void> {
	const manifestUrl = resolved.files?.manifest;

	if (!manifestUrl) {
		return;
	}

	const manifest = await getJson<ExtensionManifest>(manifestUrl);

	if (!manifest) {
		return;
	}

	const eager = (manifest.activationEvents ?? []).filter(event => event === '*' || event === 'onStartupFinished');

	if (eager.length > 0) {
		warn(
			`${entry.name}: activates eagerly (${eager.join(', ')}). As a built-in it cannot be disabled, ` +
			`so this cost lands on every window open even for users who never open a ${entry.language} file.`
		);
	}

	for (const dependency of manifest.extensionDependencies ?? []) {
		if (!shipped.has(dependency.toLowerCase())) {
			warn(
				`${entry.name}: depends on ${dependency}, which is not in the built-in list. ` +
				`It will install but never activate.`
			);
		}
	}
}

function checkEngine(entry: ManifestEntry, resolved: OpenVsxVersion, productVersion: string): void {
	const required = resolved.engines?.vscode;

	if (!required) {
		return;
	}

	const minimum = required.match(/(\d+)\.(\d+)/);
	const actual = productVersion.match(/(\d+)\.(\d+)/);

	if (!minimum || !actual) {
		return;
	}

	const wanted = [Number(minimum[1]), Number(minimum[2])];
	const have = [Number(actual[1]), Number(actual[2])];

	if (wanted[0] > have[0] || (wanted[0] === have[0] && wanted[1] > have[1])) {
		fail(
			`${entry.name}@${resolved.version} requires VS Code ${required} but this fork is ${productVersion}. ` +
			`It would install and then refuse to activate.`
		);
	}
}

function toBuiltIn(entry: ManifestEntry, resolved: OpenVsxVersion, sha256: string): BuiltInExtension {
	const { publisher } = splitId(entry.name);

	return {
		name: entry.name,
		version: resolved.version,
		sha256,
		repo: entry.repo,
		metadata: {
			id: deterministicUuid('nexgile.extension', entry.name),
			publisherId: {
				publisherId: deterministicUuid('nexgile.publisher', publisher),
				publisherName: publisher,
				displayName: entry.publisherDisplayName ?? resolved.namespaceDisplayName ?? publisher,
				flags: 'none'
			},
			publisherDisplayName: entry.publisherDisplayName ?? resolved.namespaceDisplayName ?? publisher
		},
		[MANAGED_KEY]: true,
		nexgileLanguage: entry.language,
		nexgileLicense: entry.license,
		nexgileServerDelivery: entry.serverDelivery ?? 'unknown'
	};
}

/**
 * The license text for one shipped extension, from its package or from a checked-in copy.
 *
 * Not every published package includes its LICENSE -- `ms-vscode.vscode-js-profile-table@1.0.10` omits
 * one that `1.0.11` carries -- even though the upstream grant plainly exists. Hard-failing forever on
 * that would be wrong, but silently proceeding would leave the notice obligation undischarged. So the
 * escape hatch is a file someone had to deliberately add and review, at
 * `build/nexgile/licenses/<publisher>.<name>.txt`, rather than a flag that waves the check away.
 */
async function licenseTextFor(extension: BuiltInExtension): Promise<{ text: string; source: string }> {
	const { publisher, extension: name } = splitId(extension.name);

	const detail = await getJson<OpenVsxVersion>(
		`${OPEN_VSX_API}/${encodeURIComponent(publisher)}/${encodeURIComponent(name)}/` +
		`${encodeURIComponent(extension.version)}`
	);

	const licenseUrl = detail?.files?.license;

	if (licenseUrl) {
		const response = await fetch(licenseUrl);

		if (response.ok) {
			return { text: (await response.text()).trim(), source: 'package' };
		}
	}

	const vendored = vendoredLicense(extension.name);

	if (vendored) {
		return { text: vendored, source: 'vendored' };
	}

	fail(
		`${extension.name}@${extension.version}: shipped as a built-in but carries no LICENSE, so its ` +
		`notice obligation cannot be discharged. Either pin a version that packages one, or add the ` +
		`upstream license text at build/nexgile/licenses/${extension.name}.txt after verifying it.`
	);
}

/**
 * Builds the attribution text that discharges the notice obligation for every redistributed extension.
 *
 * Scope is deliberately every entry in `builtInExtensions`, not only the ones this script manages. The
 * obligation attaches to what the installer ships, and the js-debug family was already being shipped
 * without attribution before any language extension existed. A notices file covering only the new
 * additions would leave the original gap open while looking like it had been closed.
 *
 * Returns the text rather than writing it, so that a missing license aborts the run *before* product.json
 * is modified. Writing the manifest first and discovering the problem afterwards would leave the tree in
 * a state where the build ships an extension the notices file does not cover.
 */
async function collectNotices(extensions: BuiltInExtension[], firstPartyPublishers: Set<string>): Promise<string> {
	const sections: string[] = [];
	const skipped: string[] = [];
	const vendoredUse: string[] = [];

	for (const extension of [...extensions].sort((a, b) => a.name.localeCompare(b.name))) {
		if (firstPartyPublishers.has(splitId(extension.name).publisher.toLowerCase())) {
			skipped.push(extension.name);
			continue;
		}

		const { text, source } = await licenseTextFor(extension);

		if (source === 'vendored') {
			vendoredUse.push(extension.name);
		}

		sections.push(
			['-'.repeat(57), '', `${extension.name} ${extension.version}`, extension.repo, '', text, ''].join('\n')
		);
	}

	if (skipped.length > 0) {
		info(`first-party, covered by the product EULA: ${skipped.join(', ')}`);
	}

	if (vendoredUse.length > 0) {
		info(`license text taken from build/nexgile/licenses for: ${vendoredUse.join(', ')}`);
	}

	const header = [
		'NOTICES FOR BUNDLED EXTENSIONS',
		'',
		'This product bundles the extensions listed below. Each is redistributed under its own license,',
		'reproduced here in full together with its copyright notice. Where a license requires that source',
		'be made available, the upstream repository URL accompanying the entry is that offer.',
		'',
		'This file is generated by build/nexgile/syncLanguageExtensions.ts -- do not edit it by hand.',
		''
	].join('\n');

	console.log(`\nNotices cover ${sections.length} bundled extension(s).`);

	return `${header}\n${sections.join('\n')}\n`;
}

// -------------------------------------------------------------------------------------------------
// Entry point
// -------------------------------------------------------------------------------------------------

async function main(): Promise<void> {
	const argv = process.argv.slice(2);
	const write = argv.includes('--write');
	const update = argv.includes('--update');
	const onlyArg = argv[argv.indexOf('--only') + 1];
	const only = argv.includes('--only') && onlyArg ? new Set(onlyArg.split(',')) : undefined;

	const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Manifest;
	const productSource = fs.readFileSync(productPath, 'utf8');
	const product = JSON.parse(productSource);
	const codeVersion: string = JSON.parse(fs.readFileSync(packagePath, 'utf8')).version ?? '';

	const serviceUrl: string | undefined = product.extensionsGallery?.serviceUrl;

	if (!serviceUrl) {
		fail('product.json has no extensionsGallery.serviceUrl -- cannot resolve built-in extensions.');
	}

	const existing: BuiltInExtension[] = product.builtInExtensions ?? [];
	const existingByName = new Map(existing.map(item => [item.name, item]));
	const wanted = manifest.extensions.filter(entry => !only || only.has(entry.name));

	if (wanted.length === 0) {
		console.log('No language extensions in the manifest; nothing to do.');
		return;
	}

	console.log(`Syncing ${wanted.length} language extension(s) against ${serviceUrl}\n`);

	const shipped = shippedExtensionIds(existing, manifest);
	const generated: BuiltInExtension[] = [];
	const drift: string[] = [];

	for (const entry of wanted) {
		const previous = existingByName.get(entry.name);
		const pinned = !update && !entry.version && previous ? { ...entry, version: previous.version } : entry;

		const resolved = await resolveVersion(pinned);

		checkTargetPlatform(entry, resolved);
		checkEngine(entry, resolved, codeVersion);
		await checkActivationAndDependencies(entry, resolved, shipped);

		const { sha256, bytes, contents } = await downloadAndHash(entry.name, resolved.version, serviceUrl);

		// After the download, so both license checks can read the archive rather than trusting the index.
		await verifyLicense(entry, resolved, contents);
		checkBundledLicenses(entry, contents);

		const built = toBuiltIn(entry, resolved, sha256);

		generated.push(built);

		const megabytes = (bytes / 1024 / 1024).toFixed(1);
		const changed = !previous || previous.version !== built.version || previous.sha256 !== built.sha256;

		console.log(
			`  ${changed ? '\x1b[36m~\x1b[0m' : '\x1b[32m=\x1b[0m'} ${entry.name}@${resolved.version}` +
			`  ${megabytes} MB  ${entry.language}  [${entry.serverDelivery ?? 'unknown'}]`
		);

		if (changed && previous) {
			drift.push(`${entry.name}: ${previous.version}/${previous.sha256.slice(0, 12)} -> ${built.version}/${built.sha256.slice(0, 12)}`);
		} else if (changed) {
			drift.push(`${entry.name}: new (${built.version})`);
		}

		if (entry.serverDelivery !== 'bundled') {
			info(`air-gap: ${entry.name} does not bundle its server (${entry.serverDelivery ?? 'unknown'}) -- offline installs get grammar only.`);
		}
	}

	const regenerated = new Set(generated.map(item => item.name));

	// Unmanaged entries are preserved verbatim, and a previously-managed entry that has since been removed
	// from the manifest is dropped -- that is how deletion works.
	//
	// `--only` is the exception: it regenerates a subset, so the managed entries it did not touch must be
	// carried over rather than treated as deletions. Without this, `--only redhat.java` would silently
	// remove every other language extension from the product.
	const preserved = existing.filter(item => !regenerated.has(item.name) && !item[MANAGED_KEY]);
	const carriedOver = only ? existing.filter(item => item[MANAGED_KEY] && !regenerated.has(item.name)) : [];

	// Sorted so the block's order is a function of its contents, not of manifest edit history.
	const managed = [...carriedOver, ...generated].sort((a, b) => a.name.localeCompare(b.name));
	const managedNames = new Set(managed.map(item => item.name));

	if (!write) {
		console.log();

		if (drift.length === 0) {
			console.log('\x1b[32mproduct.json is up to date.\x1b[0m');
			return;
		}

		console.log('\x1b[33mproduct.json is out of date:\x1b[0m');
		drift.forEach(line => console.log(`  ${line}`));
		console.log('\nRe-run with --write to apply.');
		process.exit(1);
	}

	let updated = spliceJsonArray(productSource, 'builtInExtensions', [...preserved, ...managed]);

	// A built-in extension is frozen forever without this list. `ExtensionsWorkbenchService`'s `outdated`
	// getter returns false unconditionally for a System extension in a `stable`-quality product unless its
	// id appears here, and `install()` short-circuits on the same check -- so a language server pinned at
	// build time could never be updated from the gallery, and a security fix upstream would require a full
	// IDE respin. Language servers move far too fast for that.
	const previouslyManaged = new Set(existing.filter(item => item[MANAGED_KEY]).map(item => item.name));
	const currentAutoUpdates: string[] = product.builtInExtensionsEnabledWithAutoUpdates ?? [];
	const autoUpdates = [
		// Ids added by hand for extensions this script does not manage stay untouched.
		...currentAutoUpdates.filter(id => !previouslyManaged.has(id) && !managedNames.has(id)),
		...managed.map(item => item.name)
	];

	updated = spliceJsonArray(updated, 'builtInExtensionsEnabledWithAutoUpdates', autoUpdates);

	// Parse before writing: a splice bug that produced invalid JSON would otherwise brick the build.
	try {
		JSON.parse(updated);
	} catch (error) {
		fail(`Refusing to write -- the result is not valid JSON: ${(error as Error).message}`);
	}

	// Built before either file is touched: an extension whose notice cannot be discharged must abort the
	// run, not leave product.json shipping something the notices file does not cover.
	const notices = await collectNotices([...preserved, ...managed], FIRST_PARTY_PUBLISHERS);

	fs.writeFileSync(productPath, updated, 'utf8');
	fs.writeFileSync(noticesPath, notices, 'utf8');

	console.log(`\n\x1b[32mWrote ${generated.length} managed entr${generated.length === 1 ? 'y' : 'ies'} to product.json.\x1b[0m`);
	console.log(`Preserved ${preserved.length} unmanaged entr${preserved.length === 1 ? 'y' : 'ies'}.`);
	console.log(`Wrote ${path.relative(root, noticesPath)}.`);
}

if (import.meta.main) {
	main().catch(error => {
		console.error(error);
		process.exit(1);
	});
}
