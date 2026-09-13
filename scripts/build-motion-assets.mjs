import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const outputDirectory = path.resolve('public/motion');
const assets = [
  ['hero-forest', 'forest.png', 960, 540, 0], ['hero-mountain', 'mountain.png', 960, 540, 1],
  ['hero-desert', 'desert.png', 960, 540, 0], ['hero-gear', 'gear.png', 960, 540, 1],
  ['tour-forest', 'forest.png', 640, 420, 1], ['tour-mountain', 'mountain.png', 640, 420, 0],
  ['tour-desert', 'desert.png', 640, 420, 1], ['product-gear', 'gear.png', 640, 420, 0],
  ['destination-green', 'forest.png', 640, 420, 0], ['destination-alpine', 'mountain.png', 640, 420, 1],
  ['story-night', 'desert.png', 640, 420, 0], ['story-equipment', 'gear.png', 640, 420, 1]
];

async function createAnimatedGif(name, sourceName, width, height, reverse) {
  const source = path.join(outputDirectory, 'sources', sourceName);
  const frameCount = 6;
  const frames = [];
  for (let index = 0; index < frameCount; index += 1) {
    const rawProgress = index / (frameCount - 1);
    const progress = reverse ? 1 - rawProgress : rawProgress;
    const zoom = 1.06 + Math.sin(rawProgress * Math.PI) * 0.055;
    const frameWidth = Math.round(width * zoom);
    const frameHeight = Math.round(height * zoom);
    frames.push(await sharp(source)
      .resize(frameWidth, frameHeight, { fit: 'cover' })
      .extract({ left: Math.round((frameWidth - width) * progress), top: Math.round((frameHeight - height) * (1 - progress) * 0.55), width, height })
      .removeAlpha().raw().toBuffer());
  }
  await sharp(Buffer.concat(frames), { raw: { width, height: height * frameCount, channels: 3, pageHeight: height } })
    .gif({ delay: Array(frameCount).fill(260), loop: 0, colours: 96, effort: 5, dither: 0.5 })
    .toFile(path.join(outputDirectory, `${name}.gif`));
  console.log(`created ${name}.gif`);
}

await fs.mkdir(outputDirectory, { recursive: true });
for (const asset of assets) await createAnimatedGif(...asset);
