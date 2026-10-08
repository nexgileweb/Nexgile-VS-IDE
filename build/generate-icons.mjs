/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Usage: node build/generate-icons.mjs [win32] [darwin] [linux] [server]
// With no arguments every platform is regenerated. Name platforms to leave the
// others' committed files untouched.

import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);

// sharp is not a dependency of this repo: use whichever copy Node resolves from
// here (e.g. after `npm i --no-save sharp`), else the original dev-box install.
function loadSharp() {
	try {
		return require('sharp');
	} catch {
		return require('C:/Users/User/node_modules/sharp');
	}
}
const sharp = loadSharp();

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const WIN32 = join(ROOT, 'resources', 'win32');
const DARWIN = join(ROOT, 'resources', 'darwin');
const LINUX = join(ROOT, 'resources', 'linux');
const SERVER = join(ROOT, 'resources', 'server');
const SVG_PATH = join(WIN32, 'nexgile-icon.svg');

const svgBuffer = readFileSync(SVG_PATH);

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// sharp rasterizes an SVG at its intrinsic size, so anything larger than that
// would be an upscaled bitmap. Raise the density to render the vector at size.
const svgIntrinsicSize = Number(/<svg[^>]*\swidth="(\d+(?:\.\d+)?)"/.exec(svgBuffer.toString('utf8'))?.[1] ?? 256);

function renderSvg(size) {
	return sharp(svgBuffer, { density: 72 * Math.max(1, size / svgIntrinsicSize) })
		.resize(size, size, { fit: 'contain', background: TRANSPARENT })
		.png()
		.toBuffer();
}

// macOS app icons follow Apple's grid: the artwork fills an 824x824 square
// centred on a 1024x1024 canvas. A full-bleed icon looks oversized in the Dock.
const MACOS_ARTWORK_RATIO = 824 / 1024;

async function renderMacIcon(size) {
	const inner = Math.round(size * MACOS_ARTWORK_RATIO);
	const before = Math.floor((size - inner) / 2);
	const after = size - inner - before;
	return sharp(await renderSvg(inner))
		.extend({ top: before, bottom: after, left: before, right: after, background: TRANSPARENT })
		.png()
		.toBuffer();
}

// ICNS format: 'icns' + total length, then one entry per representation:
// OSType (4 bytes) + entry length including this 8-byte header + PNG data.
// Every type below takes PNG data on all macOS versions Electron supports.
const icnsTypes = [
	['icp4', 16],
	['icp5', 32],
	['ic11', 32], // 16@2x
	['ic12', 64], // 32@2x
	['ic07', 128],
	['ic13', 256], // 128@2x
	['ic08', 256],
	['ic14', 512], // 256@2x
	['ic09', 512],
	['ic10', 1024], // 512@2x
];

function buildIcns(entries) {
	const chunks = entries.map(([type, png]) => {
		const header = Buffer.alloc(8);
		header.write(type, 0, 'ascii');
		header.writeUInt32BE(8 + png.length, 4);
		return Buffer.concat([header, png]);
	});
	const header = Buffer.alloc(8);
	header.write('icns', 0, 'ascii');
	header.writeUInt32BE(8 + chunks.reduce((total, chunk) => total + chunk.length, 0), 4);
	return Buffer.concat([header, ...chunks]);
}

// ICO format: Header (6 bytes) + Directory entries (16 bytes each) + PNG blobs
function buildIco(pngBuffers) {
	const count = pngBuffers.length;
	const headerSize = 6;
	const dirEntrySize = 16;
	const dirSize = dirEntrySize * count;
	const dataOffset = headerSize + dirSize;

	let currentOffset = dataOffset;
	const offsets = [];
	for (const png of pngBuffers) {
		offsets.push(currentOffset);
		currentOffset += png.length;
	}

	const totalSize = currentOffset;
	const buf = Buffer.alloc(totalSize);

	buf.writeUInt16LE(0, 0);
	buf.writeUInt16LE(1, 2);
	buf.writeUInt16LE(count, 4);

	for (let i = 0; i < count; i++) {
		const png = pngBuffers[i];
		const entryOffset = headerSize + i * dirEntrySize;
		const width = png.readUInt32BE(16);
		const height = png.readUInt32BE(20);

		buf.writeUInt8(width >= 256 ? 0 : width, entryOffset);
		buf.writeUInt8(height >= 256 ? 0 : height, entryOffset + 1);
		buf.writeUInt8(0, entryOffset + 2);
		buf.writeUInt8(0, entryOffset + 3);
		buf.writeUInt16LE(1, entryOffset + 4);
		buf.writeUInt16LE(32, entryOffset + 6);
		buf.writeUInt32LE(png.length, entryOffset + 8);
		buf.writeUInt32LE(offsets[i], entryOffset + 12);
	}

	for (let i = 0; i < count; i++) {
		pngBuffers[i].copy(buf, offsets[i]);
	}

	return buf;
}

// Inno Setup needs 24-bit uncompressed BMP files
async function buildBmp(svgBuf, width, height) {
	const raw = await sharp(svgBuf)
		.resize(width, height, { fit: 'contain', background: { r: 26, g: 26, b: 46, alpha: 1 } })
		.removeAlpha()
		.raw()
		.toBuffer();

	const rowBytes = width * 3;
	const rowPadding = (4 - (rowBytes % 4)) % 4;
	const paddedRowSize = rowBytes + rowPadding;
	const pixelDataSize = paddedRowSize * height;
	const headerSize = 14 + 40;
	const fileSize = headerSize + pixelDataSize;

	const bmp = Buffer.alloc(fileSize);

	// BMP file header
	bmp.write('BM', 0);
	bmp.writeUInt32LE(fileSize, 2);
	bmp.writeUInt32LE(0, 6);
	bmp.writeUInt32LE(headerSize, 10);

	// DIB header (BITMAPINFOHEADER)
	bmp.writeUInt32LE(40, 14);
	bmp.writeInt32LE(width, 18);
	bmp.writeInt32LE(height, 22);
	bmp.writeUInt16LE(1, 26);
	bmp.writeUInt16LE(24, 28);
	bmp.writeUInt32LE(0, 30);
	bmp.writeUInt32LE(pixelDataSize, 34);
	bmp.writeInt32LE(2835, 38);
	bmp.writeInt32LE(2835, 42);
	bmp.writeUInt32LE(0, 46);
	bmp.writeUInt32LE(0, 50);

	// Pixel data: bottom-to-top rows, RGB to BGR
	for (let y = 0; y < height; y++) {
		const srcRow = y;
		const dstRow = height - 1 - y;
		for (let x = 0; x < width; x++) {
			const srcIdx = (srcRow * width + x) * 3;
			const dstIdx = headerSize + dstRow * paddedRowSize + x * 3;
			bmp[dstIdx] = raw[srcIdx + 2];
			bmp[dstIdx + 1] = raw[srcIdx + 1];
			bmp[dstIdx + 2] = raw[srcIdx];
		}
	}

	return bmp;
}

async function generateWin32() {
	// Generate PNGs at all ICO sizes
	const icoSizes = [16, 24, 32, 48, 64, 128, 256];
	const pngBuffers = [];

	for (const size of icoSizes) {
		const png = await sharp(svgBuffer)
			.resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
			.png()
			.toBuffer();
		pngBuffers.push(png);
		console.log(`  PNG ${size}x${size}: ${png.length} bytes`);
	}

	// Build ICO files
	const ico = buildIco(pngBuffers);
	writeFileSync(join(WIN32, 'code.ico'), ico);
	writeFileSync(join(WIN32, 'default.ico'), ico);
	console.log(`  code.ico: ${ico.length} bytes (${icoSizes.length} sizes)`);
	console.log('  default.ico: copied');

	// Windows tile PNGs
	for (const size of [70, 150]) {
		const png = await sharp(svgBuffer)
			.resize(size, size, { fit: 'contain', background: { r: 26, g: 26, b: 46, alpha: 1 } })
			.png()
			.toBuffer();
		writeFileSync(join(WIN32, `code_${size}x${size}.png`), png);
		console.log(`  code_${size}x${size}.png: ${png.length} bytes`);
	}

	// Inno Setup BMPs - big wizard image: 164x314 at various DPI scales
	const bigScales = [100, 125, 150, 175, 200, 225, 250];
	for (const scale of bigScales) {
		const w = Math.round(164 * scale / 100);
		const h = Math.round(314 * scale / 100);
		const bmp = await buildBmp(svgBuffer, w, h);
		writeFileSync(join(WIN32, `inno-big-${scale}.bmp`), bmp);
		console.log(`  inno-big-${scale}.bmp: ${w}x${h}, ${bmp.length} bytes`);
	}

	// Small wizard image: 55x58 at various DPI scales
	for (const scale of bigScales) {
		const w = Math.round(55 * scale / 100);
		const h = Math.round(58 * scale / 100);
		const bmp = await buildBmp(svgBuffer, w, h);
		writeFileSync(join(WIN32, `inno-small-${scale}.bmp`), bmp);
		console.log(`  inno-small-${scale}.bmp: ${w}x${h}, ${bmp.length} bytes`);
	}
}

// App, Dock and DMG icon on macOS.
async function generateDarwin() {
	const entries = [];
	for (const [type, size] of icnsTypes) {
		entries.push([type, await renderMacIcon(size)]);
	}
	const icns = buildIcns(entries);
	writeFileSync(join(DARWIN, 'code.icns'), icns);
	console.log(`  code.icns: ${icns.length} bytes (${entries.length} representations)`);
}

// Window icon on Linux, and the launcher icon the .deb/.rpm install.
async function generateLinux() {
	const png = await renderSvg(1024);
	writeFileSync(join(LINUX, 'code.png'), png);
	console.log(`  code.png: 1024x1024, ${png.length} bytes`);
}

// Web manifest icons of the server and web builds.
async function generateServer() {
	for (const size of [192, 512]) {
		const png = await renderSvg(size);
		writeFileSync(join(SERVER, `code-${size}.png`), png);
		console.log(`  code-${size}.png: ${size}x${size}, ${png.length} bytes`);
	}
}

const generators = {
	win32: generateWin32,
	darwin: generateDarwin,
	linux: generateLinux,
	server: generateServer,
};

async function main() {
	const targets = process.argv.slice(2);
	const unknown = targets.filter(target => !Object.hasOwn(generators, target));
	if (unknown.length) {
		throw new Error(`Unknown platform(s): ${unknown.join(', ')}. Expected any of: ${Object.keys(generators).join(', ')}.`);
	}

	console.log('Generating icons from', SVG_PATH);
	for (const target of targets.length ? targets : Object.keys(generators)) {
		console.log(`${target}:`);
		await generators[target]();
	}

	console.log('\nDone! All icons generated.');
}

main().catch(err => {
	console.error('Error:', err);
	process.exit(1);
});
