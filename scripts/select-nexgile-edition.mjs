/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Points product.json at one of the committed nexgile-code extension VSIXes.
//
// Usage: node scripts/select-nexgile-edition.mjs <standard|taa>
//
//   standard -> build/extensions/nexgile-code-<version>.vsix      (all providers)
//   taa      -> build/extensions/nexgile-code-taa-<version>.vsix  (TAA edition:
//               no Chinese-origin providers/models)
//
// Both VSIXes are produced and committed by the coding-agent repo's
// `pnpm ship:ide --both` (Nexgile-RC-CodingAgent). This script rewrites the
// nexgile.nexgile-code builtInExtensions entry (version, vsix path, sha256)
// in place, preserving the file's formatting, and clears the unpacked copies
// under .build/ so the next build re-extracts the selected VSIX. Used by the
// build-windows/linux/macos workflows' "edition" input and runnable locally.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const EXTENSION_NAME = 'nexgile.nexgile-code';

const edition = process.argv[2];

function fail(message) {
	console.error(`\n[select-nexgile-edition] ERROR: ${message}`);
	process.exit(1);
}

if (edition !== 'standard' && edition !== 'taa') {
	fail(`Usage: node scripts/select-nexgile-edition.mjs <standard|taa> (got "${edition ?? ''}")`);
}

// --- Locate the requested edition's VSIX -------------------------------------

const extensionsDir = path.join(repoRoot, 'build', 'extensions');
const pattern = edition === 'taa' ? /^nexgile-code-taa-(\d+\.\d+\.\d+)\.vsix$/ : /^nexgile-code-(\d+\.\d+\.\d+)\.vsix$/;

const candidates = fs
	.readdirSync(extensionsDir)
	.map((file) => ({ file, match: file.match(pattern) }))
	.filter(({ match }) => match);

if (candidates.length === 0) {
	fail(
		`No ${edition} edition VSIX found in build/extensions. ` +
			`Run \`pnpm ship:ide --both\` in the Nexgile-RC-CodingAgent repo and commit the result.`
	);
}
if (candidates.length > 1) {
	fail(`Multiple ${edition} edition VSIXes found in build/extensions: ${candidates.map((c) => c.file).join(', ')}`);
}

const { file: vsixName, match } = candidates[0];
const version = match[1];
const vsixField = `build/extensions/${vsixName}`;
const sha256 = crypto
	.createHash('sha256')
	.update(fs.readFileSync(path.join(extensionsDir, vsixName)))
	.digest('hex');

// --- Splice product.json in place ---------------------------------------------

const productJsonPath = path.join(repoRoot, 'product.json');
const raw = fs.readFileSync(productJsonPath, 'utf8');

const blockRe = /\{[^{}]*"name":\s*"nexgile\.nexgile-code"[\s\S]*?"vsix":\s*"[^"]*"/;
const blockMatch = raw.match(blockRe);

if (!blockMatch) {
	fail(`Could not locate the ${EXTENSION_NAME} version/sha256/vsix fields in product.json.`);
}

const updatedBlock = blockMatch[0]
	.replace(/("version":\s*")[^"]*(")/, `$1${version}$2`)
	.replace(/("sha256":\s*")[^"]*(")/, `$1${sha256}$2`)
	.replace(/("vsix":\s*")[^"]*(")/, `$1${vsixField}$2`);
const updatedRaw = raw.replace(blockMatch[0], updatedBlock);

const reparsed = JSON.parse(updatedRaw).builtInExtensions.find((extension) => extension.name === EXTENSION_NAME);
if (reparsed.version !== version || reparsed.sha256 !== sha256 || reparsed.vsix !== vsixField) {
	fail('In-place product.json update did not produce the expected fields; aborting before write.');
}

fs.writeFileSync(productJsonPath, updatedRaw);

// --- Clear unpacked copies so the next build re-extracts ----------------------

for (const stale of [
	path.join(repoRoot, '.build', 'builtInExtensions', EXTENSION_NAME),
	path.join(repoRoot, '.build', 'extensions', EXTENSION_NAME)
]) {
	if (fs.existsSync(stale)) {
		fs.rmSync(stale, { recursive: true, force: true });
		console.log(`[select-nexgile-edition] Cleared stale unpacked copy: ${stale}`);
	}
}

console.log(`[select-nexgile-edition] product.json now bundles the ${edition.toUpperCase()} edition:`);
console.log(`[select-nexgile-edition]   ${vsixField} (v${version})`);
console.log(`[select-nexgile-edition]   sha256=${sha256}`);
