import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

const jobs = [
  { src: 'logo.png', out: 'logo.webp', width: 256, q: 82 },
  { src: 'college_logo.png', out: 'college_logo.webp', width: 512, q: 82 },
  { src: 'cert-left.png', out: 'cert-left.webp', width: 512, q: 80 },
  { src: 'cert-right.png', out: 'cert-right.webp', width: 512, q: 80 },
  { src: 'campus1.jpg', out: 'campus1.webp', width: 1280, q: 72 },
  { src: 'campus3.jpg', out: 'campus3.webp', width: 1280, q: 72 },
  { src: 'campus4.jpg', out: 'campus4.webp', width: 1280, q: 72 },
  { src: 'campus5.jpg', out: 'campus5.webp', width: 1280, q: 72 },
  { src: 'campus6.jpg', out: 'campus6.webp', width: 1280, q: 72 },
  { src: 'campus7.jpg', out: 'campus7.webp', width: 1280, q: 72 },
];

for (const job of jobs) {
  const input = path.join(publicDir, job.src);
  const output = path.join(publicDir, job.out);
  await sharp(input, { failOn: 'none' })
    .resize({ width: job.width, withoutEnlargement: true })
    .webp({ quality: job.q })
    .toFile(output);
  const size = (await fs.stat(output)).size;
  console.log(`${job.src} -> ${job.out}  ${(size / 1024).toFixed(0)} KB`);
}

// Small crisp PNG for iOS apple-touch-icon (iOS does not read webp touch icons)
await sharp(path.join(publicDir, 'logo.png'), { failOn: 'none' })
  .resize({ width: 180, height: 180, fit: 'inside', withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: true })
  .toFile(path.join(publicDir, 'apple-touch-icon.png'));
console.log(`logo.png -> apple-touch-icon.png  ${((await fs.stat(path.join(publicDir, 'apple-touch-icon.png'))).size / 1024).toFixed(0)} KB`);

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