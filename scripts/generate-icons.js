// Generate Nexgile Code icon assets
// Creates SVG programmatically, converts to ICO and PNG

const fs = require('fs');
const path = require('path');

const BG_COLOR = '#0a0e1a';
const ACCENT_COLOR = '#3b82f6';
const ACCENT_LIGHT = '#60a5fa';

/**
 * Generate an SVG icon with the Nexgile "N" monogram
 * @param {number} size - icon size in pixels
 * @param {boolean} withBg - include background
 */
function generateSvg(size, withBg = true) {
  const padding = size * 0.15;
  const strokeWidth = size * 0.08;

  // N monogram coordinates (relative to content area)
  const cx = size / 2;
  const cy = size / 2;
  const left = padding + strokeWidth / 2;
  const right = size - padding - strokeWidth / 2;
  const top = padding + strokeWidth / 2;
  const bottom = size - padding - strokeWidth / 2;

  const bgRect = withBg
    ? `<rect width="${size}" height="${size}" rx="${size * 0.18}" fill="${BG_COLOR}"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bgRect}
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${ACCENT_LIGHT};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${ACCENT_COLOR};stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M ${left} ${bottom} L ${left} ${top} L ${right} ${bottom} L ${right} ${top}"
        fill="none" stroke="url(#grad)" stroke-width="${strokeWidth}"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

/**
 * Generate a BMP image from SVG data (simplified rasterization)
 * Since we can't use sharp/canvas without npm install, generate BMPs directly
 */
function generateBmp(width, height) {
  // Create a simple BMP with the N monogram
  const rowSize = Math.ceil((width * 3) / 4) * 4; // rows padded to 4 bytes
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize; // header + pixel data

  const buf = Buffer.alloc(fileSize);

  // BMP Header
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(0, 6); // reserved
  buf.writeUInt32LE(54, 10); // pixel data offset

  // DIB Header (BITMAPINFOHEADER)
  buf.writeUInt32LE(40, 14); // header size
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22); // positive = bottom-up
  buf.writeUInt16LE(1, 26); // color planes
  buf.writeUInt16LE(24, 28); // bits per pixel
  buf.writeUInt32LE(0, 30); // no compression
  buf.writeUInt32LE(pixelDataSize, 34);
  buf.writeInt32LE(2835, 38); // h resolution (72 DPI)
  buf.writeInt32LE(2835, 42); // v resolution
  buf.writeUInt32LE(0, 46); // colors in palette
  buf.writeUInt32LE(0, 50); // important colors

  // Parse colors
  const bg = { r: 0x0a, g: 0x0e, b: 0x1a };
  const accent = { r: 0x3b, g: 0x82, b: 0xf6 };

  // Draw the N monogram
  const padding = width * 0.15;
  const strokeW = Math.max(width * 0.08, 2);
  const left = padding;
  const right = width - padding;
  const top = padding;
  const bottom = height - padding;

  // Generate pixel data (BMP is bottom-up)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const bmpY = height - 1 - y; // flip for bottom-up
      let isStroke = false;

      // Left vertical line
      if (x >= left - strokeW / 2 && x <= left + strokeW / 2 && y >= top && y <= bottom) {
        isStroke = true;
      }
      // Right vertical line
      if (x >= right - strokeW / 2 && x <= right + strokeW / 2 && y >= top && y <= bottom) {
        isStroke = true;
      }
      // Diagonal line from top-left to bottom-right
      const diagX = left + (x - left); // x position
      const expectedY = top + ((diagX - left) / (right - left)) * (bottom - top);
      if (Math.abs(y - expectedY) <= strokeW / 2 && x >= left && x <= right) {
        isStroke = true;
      }

      const offset = 54 + bmpY * rowSize + x * 3;
      if (isStroke) {
        // Gradient from light to accent
        const t = (x - left) / (right - left);
        const r = Math.round(0x60 + t * (0x3b - 0x60));
        const g = Math.round(0xa5 + t * (0x82 - 0xa5));
        const b = Math.round(0xfa + t * (0xf6 - 0xfa));
        buf[offset] = b;     // Blue
        buf[offset + 1] = g; // Green
        buf[offset + 2] = r; // Red
      } else {
        buf[offset] = bg.b;
        buf[offset + 1] = bg.g;
        buf[offset + 2] = bg.r;
      }
    }
  }

  return buf;
}

/**
 * Generate ICO file from multiple BMP sizes
 */
function generateIco(sizes) {
  const bmps = sizes.map(s => ({ size: s, data: generateBmp(s, s) }));

  // ICO header: 6 bytes
  // Each entry: 16 bytes
  // Then BMP data (without file header - 14 bytes)
  const headerSize = 6 + bmps.length * 16;
  let dataOffset = headerSize;
  const entries = bmps.map(({ size, data }) => {
    const bmpDataSize = data.length - 14; // strip BMP file header
    const entry = { size, offset: dataOffset, dataSize: bmpDataSize, data: data.slice(14) };
    // Fix DIB height to be double (ICO convention: AND mask + XOR mask)
    const dibData = Buffer.from(entry.data);
    dibData.writeInt32LE(size * 2, 8); // double height in DIB header
    entry.data = dibData;
    dataOffset += bmpDataSize;
    return entry;
  });

  const totalSize = dataOffset;
  const ico = Buffer.alloc(totalSize);

  // ICO header
  ico.writeUInt16LE(0, 0);     // reserved
  ico.writeUInt16LE(1, 2);     // type: ICO
  ico.writeUInt16LE(bmps.length, 4); // image count

  // Directory entries
  entries.forEach((entry, i) => {
    const off = 6 + i * 16;
    ico[off] = entry.size >= 256 ? 0 : entry.size;     // width
    ico[off + 1] = entry.size >= 256 ? 0 : entry.size; // height
    ico[off + 2] = 0;  // palette colors
    ico[off + 3] = 0;  // reserved
    ico.writeUInt16LE(1, off + 4);  // color planes
    ico.writeUInt16LE(24, off + 6); // bits per pixel
    ico.writeUInt32LE(entry.dataSize, off + 8);
    ico.writeUInt32LE(entry.offset, off + 12);
  });

  // Image data
  entries.forEach(entry => {
    entry.data.copy(ico, entry.offset);
  });

  return ico;
}

/**
 * Generate a minimal PNG file
 */
function generatePng(width, height) {
  // We'll use a very simple approach - create the raw pixel data
  // For a proper PNG we need: signature, IHDR, IDAT (zlib compressed), IEND
  const zlib = require('zlib');

  const bg = { r: 0x0a, g: 0x0e, b: 0x1a };

  // Generate RGBA pixel data with filter byte
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  const padding = width * 0.15;
  const strokeW = Math.max(width * 0.08, 2);
  const left = padding;
  const right = width - padding;
  const top = padding;
  const bottom = height - padding;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawData[rowOffset] = 0; // no filter

    for (let x = 0; x < width; x++) {
      let isStroke = false;

      // Left vertical
      if (x >= left - strokeW / 2 && x <= left + strokeW / 2 && y >= top && y <= bottom) isStroke = true;
      // Right vertical
      if (x >= right - strokeW / 2 && x <= right + strokeW / 2 && y >= top && y <= bottom) isStroke = true;
      // Diagonal
      const expectedY = top + ((x - left) / (right - left)) * (bottom - top);
      if (Math.abs(y - expectedY) <= strokeW / 2 && x >= left && x <= right) isStroke = true;

      const px = rowOffset + 1 + x * 4;
      if (isStroke) {
        const t = Math.max(0, Math.min(1, (x - left) / (right - left)));
        rawData[px] = Math.round(0x60 + t * (0x3b - 0x60));
        rawData[px + 1] = Math.round(0xa5 + t * (0x82 - 0xa5));
        rawData[px + 2] = Math.round(0xfa + t * (0xf6 - 0xfa));
        rawData[px + 3] = 0xff;
      } else {
        rawData[px] = bg.r;
        rawData[px + 1] = bg.g;
        rawData[px + 2] = bg.b;
        rawData[px + 3] = 0xff;
      }
    }
  }

  // Compress with zlib
  const compressed = zlib.deflateSync(rawData);

  // Build PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = crc32(typeAndData);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc);
    return Buffer.concat([len, typeAndData, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation for PNG chunks
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Main
const resourcesDir = path.join(__dirname, '..', 'resources', 'win32');

console.log('Generating Nexgile Code icons...');

// Generate ICO files (multi-resolution)
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const ico = generateIco(icoSizes);

fs.writeFileSync(path.join(resourcesDir, 'code.ico'), ico);
console.log('  -> code.ico (main app icon)');

fs.writeFileSync(path.join(resourcesDir, 'default.ico'), ico);
console.log('  -> default.ico (file association icon)');

// Generate PNG tiles
const png70 = generatePng(70, 70);
fs.writeFileSync(path.join(resourcesDir, 'code_70x70.png'), png70);
console.log('  -> code_70x70.png');

const png150 = generatePng(150, 150);
fs.writeFileSync(path.join(resourcesDir, 'code_150x150.png'), png150);
console.log('  -> code_150x150.png');

// Generate SVG source for reference
const svg256 = generateSvg(256);
fs.writeFileSync(path.join(resourcesDir, 'nexgile-icon.svg'), svg256);
console.log('  -> nexgile-icon.svg (source reference)');

console.log('Done! All icons generated.');
