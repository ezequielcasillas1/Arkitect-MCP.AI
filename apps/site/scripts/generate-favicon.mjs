import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "..", "public");
const svgPath = path.join(publicDir, "favicon.svg");
const png16 = path.join(publicDir, "favicon-16.png");
const png32 = path.join(publicDir, "favicon-32.png");
const icoPath = path.join(publicDir, "favicon.ico");

function renderPng(size, output) {
  const result = spawnSync(
    "npx",
    ["--yes", "@resvg/resvg-js-cli", "--fit-width", String(size), svgPath, output],
    { stdio: "inherit", shell: true }
  );
  if (result.status !== 0) {
    throw new Error(`Failed to render ${size}px PNG`);
  }
}

function pngToIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  let offset = 6 + count * 16;

  for (let i = 0; i < count; i += 1) {
    const png = pngBuffers[i];
    const size = sizes[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

renderPng(16, png16);
renderPng(32, png32);

const png16Buf = readFileSync(png16);
const png32Buf = readFileSync(png32);
writeFileSync(icoPath, pngToIco([png16Buf, png32Buf], [16, 32]));

unlinkSync(png16);
unlinkSync(png32);

console.log(`Wrote ${icoPath} (${readFileSync(icoPath).length} bytes)`);
