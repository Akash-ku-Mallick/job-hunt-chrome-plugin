import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.resolve(__dirname, '../icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to generate an uncompressed or zlib-compressed raw PNG
function createPng(size) {
  // Simple PNG generator with purple/cyan gradient and bolt symbol
  const width = size;
  const height = size;
  
  // Scanlines: each scanline has 1 filter byte (0) + width * 4 bytes (RGBA)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      // Create a nice gradient with lightning bolt pattern in center
      const nx = x / width;
      const ny = y / height;
      const distFromCenter = Math.sqrt((nx - 0.5) ** 2 + (ny - 0.5) ** 2);
      
      let r = 79;
      let g = 70;
      let b = 229; // Indigo #4f46e5
      let a = 255;

      if (distFromCenter < 0.45) {
        // Subtle gradient towards cyan at bottom-right
        r = Math.floor(79 + nx * 50);
        g = Math.floor(70 + ny * 100);
        b = Math.floor(229 - nx * 30);
      } else {
        a = 0; // Rounded transparent corners
      }

      // Center lightning bolt highlight
      if (Math.abs(nx + (ny - 0.5) * 0.5 - 0.5) < 0.1 && ny > 0.2 && ny < 0.8) {
        r = 250;
        g = 204;
        b = 21; // Yellow accent #facc15
        a = 255;
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression method
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace method

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(4 + 4 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  
  // Calculate CRC32
  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 implementation
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const sizes = [16, 32, 48, 128];
for (const size of sizes) {
  const pngBuffer = createPng(size);
  const filePath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, pngBuffer);
  console.log(`Generated icon: ${filePath} (${size}x${size})`);
}

