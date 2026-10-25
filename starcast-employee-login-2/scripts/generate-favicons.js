const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const imagesDir = path.join(publicDir, 'images');
const appDir = path.join(rootDir, 'app');

const defaultSrc = path.join(imagesDir, 'spacemanlogo.png');
const customSrc = 'C:/Users/ray/.gemini/antigravity-ide/brain/65edc707-11e1-49d6-b7fd-cf408e193305/.user_uploaded/media_1792962408693.png';
const srcPath = fs.existsSync(customSrc) ? customSrc : defaultSrc;

async function main() {
  console.log('Reading source image from:', srcPath);
  const srcBuffer = fs.readFileSync(srcPath);

  // 1. Master square logos in public/images
  console.log('Writing public/images/spacemanlogo.png (1024x1024)...');
  await sharp(srcBuffer)
    .resize(1024, 1024)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(imagesDir, 'spacemanlogo.png'));

  console.log('Writing public/images/spacemanlogo.webp (1024x1024)...');
  await sharp(srcBuffer)
    .resize(1024, 1024)
    .webp({ quality: 90 })
    .toFile(path.join(imagesDir, 'spacemanlogo.webp'));

  console.log('Writing public/images/starcast-mascot.png & webp...');
  await sharp(srcBuffer)
    .resize(1024, 1024)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(imagesDir, 'starcast-mascot.png'));

  await sharp(srcBuffer)
    .resize(1024, 1024)
    .webp({ quality: 90 })
    .toFile(path.join(imagesDir, 'starcast-mascot.webp'));

  // 2. Apple Touch Icons (180x180 standard for iOS Retina Home Screen / Apple Shortcuts)
  console.log('Writing Apple touch icons (180x180)...');
  const apple180Buffer = await sharp(srcBuffer)
    .resize(180, 180)
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'apple-icon.png'), apple180Buffer);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), apple180Buffer);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon-precomposed.png'), apple180Buffer);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), apple180Buffer);

  // 3. PWA / App Shortcut Icons (192x192 and 512x512)
  console.log('Writing PWA / Shortcut icons (192x192, 512x512)...');
  await sharp(srcBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  await sharp(srcBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // Copy 192 to app/icon.png
  await sharp(srcBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(appDir, 'icon.png'));

  // 4. Tab 32x32 PNG favicons
  console.log('Writing 32x32 PNG favicons...');
  const png32 = await sharp(srcBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-dark-32x32.png'), png32);
  fs.writeFileSync(path.join(publicDir, 'icon-light-32x32.png'), png32);

  // 5. Multi-resolution favicon.ico (16x16, 32x32, 48x48)
  console.log('Generating favicon.ico with 16x16, 32x32, 48x48...');
  const p16 = await sharp(srcBuffer).resize(16, 16).png().toBuffer();
  const p32 = await sharp(srcBuffer).resize(32, 32).png().toBuffer();
  const p48 = await sharp(srcBuffer).resize(48, 48).png().toBuffer();

  const icoImages = [
    { width: 16, height: 16, buffer: p16 },
    { width: 32, height: 32, buffer: p32 },
    { width: 48, height: 48, buffer: p48 }
  ];

  const count = icoImages.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4); // count

  let offset = 6 + count * 16;
  const dirEntries = [];
  for (const img of icoImages) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width, 0);
    entry.writeUInt8(img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    offset += img.buffer.length;
    dirEntries.push(entry);
  }

  const icoBuf = Buffer.concat([header, ...dirEntries, ...icoImages.map(img => img.buffer)]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuf);

  console.log('Favicon and icon assets successfully generated!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
