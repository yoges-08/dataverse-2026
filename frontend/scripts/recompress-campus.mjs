import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

// Re-compress existing campus .webp files to smaller size (width 1600, quality 72)
const campusFiles = ['campus1.webp', 'campus3.webp', 'campus4.webp', 'campus5.webp', 'campus6.webp', 'campus7.webp'];

for (const file of campusFiles) {
  const input = path.join(publicDir, file);
  const tempOutput = path.join(publicDir, `${file}.tmp`);
  await sharp(input)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(tempOutput);
  await fs.rename(tempOutput, input);
  const size = (await fs.stat(input)).size;
  console.log(`Re-compressed ${file} -> ${(size / 1024).toFixed(0)} KB`);
}