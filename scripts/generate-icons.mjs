#!/usr/bin/env node
// Genera los PNG de íconos de marca a partir del logo real en
// assets/brand/pentagolazo-mark.png (fondo blanco) y
// assets/brand/pentagolazo-mark-transparent.png (fondo removido por flood-fill,
// conserva los blancos internos del diseño — balón, anillos, líneas).
// Uso puntual (requiere `npm install --no-save sharp` primero, no es
// dependencia permanente del proyecto): node scripts/generate-icons.mjs
import sharp from 'sharp';

const BRAND_DIR = 'assets/brand';
const OUT_DIR = 'assets';
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const CANVAS = 1024;

async function squareOnBackground(srcPath, outPath, { canvas = CANVAS, fillRatio = 1, background = WHITE } = {}) {
  const size = Math.round(canvas * fillRatio);
  const resized = await sharp(srcPath).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: canvas, height: canvas, channels: 4, background } })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toFile(outPath);
}

const jobs = [
  // Ícono principal (iOS + web favicon): logo con fondo blanco, borde a borde.
  { fn: () => squareOnBackground(`${BRAND_DIR}/pentagolazo-mark.png`, `${OUT_DIR}/icon.png`, { canvas: 1024, fillRatio: 1 }) },
  { fn: () => squareOnBackground(`${BRAND_DIR}/pentagolazo-mark.png`, `${OUT_DIR}/favicon.png`, { canvas: 196, fillRatio: 1 }) },
  // Adaptive icon Android: foreground dentro de la zona segura (~66%), transparente.
  { fn: () => squareOnBackground(`${BRAND_DIR}/pentagolazo-mark-transparent.png`, `${OUT_DIR}/android-icon-foreground.png`, { canvas: 1024, fillRatio: 0.62, background: { r: 0, g: 0, b: 0, alpha: 0 } }) },
  { fn: () => sharp({ create: { width: 1024, height: 1024, channels: 4, background: WHITE } }).png().toFile(`${OUT_DIR}/android-icon-background.png`) },
  // Splash: marca sobre transparente, se ve sobre el backgroundColor del splash config.
  { fn: () => squareOnBackground(`${BRAND_DIR}/pentagolazo-mark-transparent.png`, `${OUT_DIR}/splash-icon.png`, { canvas: 640, fillRatio: 1, background: { r: 0, g: 0, b: 0, alpha: 0 } }) },
];

for (const job of jobs) {
  await job.fn();
}

// Monochrome: silueta de un solo color (blanco) a partir del alpha del foreground,
// para el ícono temático de Android 13+.
const fg = sharp(`${OUT_DIR}/android-icon-foreground.png`);
const { data, info } = await fg.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const mono = Buffer.alloc(data.length);
for (let i = 0; i < data.length; i += info.channels) {
  mono[i] = 255;
  mono[i + 1] = 255;
  mono[i + 2] = 255;
  mono[i + 3] = data[i + 3];
}
await sharp(mono, { raw: info }).png().toFile(`${OUT_DIR}/android-icon-monochrome.png`);

console.log('✓ Íconos generados desde el logo real de PENTAGOLAZO');
