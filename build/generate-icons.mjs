/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sharp = require('C:/Users/User/node_modules/sharp');
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.url.replace('file:///', '').replace(/\//g, '\\'), '..', '..').replace(/\\/g, '/');
const WIN32 = join(ROOT, 'resources', 'win32').replace(/\\/g, '/');
const SVG_PATH = join(WIN32, 'nexgile-icon.svg').replace(/\\/g, '/');

const svgBuffer = readFileSync(SVG_PATH);

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

async function main() {
	console.log('Generating icons from', SVG_PATH);

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

	console.log('\nDone! All icons generated.');
}

main().catch(err => {
	console.error('Error:', err);
	process.exit(1);
});
