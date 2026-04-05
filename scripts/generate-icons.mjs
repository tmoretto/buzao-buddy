import sharp from 'sharp';
import { createCanvas } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Render a 1024x1024 icon: dark bg, yellow rounded square, native 🚌 emoji
function renderIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size / 1024; // scale factor

  // Dark background with rounded corners
  const radius = 224 * s;
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // Yellow rounded square
  const inset = 192 * s;
  const innerSize = 640 * s;
  const innerRadius = 160 * s;
  ctx.fillStyle = '#FFB800';
  ctx.beginPath();
  ctx.roundRect(inset, inset, innerSize, innerSize, innerRadius);
  ctx.fill();

  // Bus emoji centered
  const fontSize = 420 * s;
  ctx.font = `${fontSize}px "Apple Color Emoji"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🚌', size / 2, size / 2 + 20 * s);

  return canvas.toBuffer('image/png');
}

// Foreground only (emoji + yellow square on transparent) for Android adaptive
function renderForeground(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size / 1024;

  const inset = 192 * s;
  const innerSize = 640 * s;
  const innerRadius = 160 * s;
  ctx.fillStyle = '#FFB800';
  ctx.beginPath();
  ctx.roundRect(inset, inset, innerSize, innerSize, innerRadius);
  ctx.fill();

  const fontSize = 420 * s;
  ctx.font = `${fontSize}px "Apple Color Emoji"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🚌', size / 2, size / 2 + 20 * s);

  return canvas.toBuffer('image/png');
}

const masterBuffer = renderIcon(1024);

// iOS - single 1024x1024 icon
const iosDir = join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
writeFileSync(join(iosDir, 'AppIcon-512@2x.png'), masterBuffer);
console.log('✓ iOS icon: 1024x1024');

// Android adaptive icon sizes
const androidSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

const androidRes = join(root, 'android/app/src/main/res');

// Background (solid dark)
const bgSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#111111"/>
</svg>`;
const bgBuffer = Buffer.from(bgSvg);

for (const [folder, size] of Object.entries(androidSizes)) {
  const dir = join(androidRes, folder);
  mkdirSync(dir, { recursive: true });
  
  // Render at native size for best quality
  const iconBuf = renderIcon(size);
  const fgBuf = renderForeground(size);
  
  writeFileSync(join(dir, 'ic_launcher.png'), iconBuf);
  writeFileSync(join(dir, 'ic_launcher_round.png'), iconBuf);
  writeFileSync(join(dir, 'ic_launcher_foreground.png'), fgBuf);
  await sharp(bgBuffer).resize(size, size).png().toFile(join(dir, 'ic_launcher_background.png'));
  
  console.log(`✓ Android ${folder}: ${size}x${size}`);
}

// Create adaptive icon XML
const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

const anydpiDir = join(androidRes, 'mipmap-anydpi-v26');
mkdirSync(anydpiDir, { recursive: true });
writeFileSync(join(anydpiDir, 'ic_launcher.xml'), adaptiveXml);
writeFileSync(join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml);
console.log('✓ Android adaptive icon XML');

// PWA icons for public/
const pwaSizes = [192, 512];
for (const size of pwaSizes) {
  const buf = renderIcon(size);
  writeFileSync(join(root, `public/icon-${size}.png`), buf);
  console.log(`✓ PWA icon: ${size}x${size}`);
}

console.log('\nAll icons generated!');
