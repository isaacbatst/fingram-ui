import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconSvg = path.join(__dirname, '../public/icon.svg');

async function generateIcons() {
  try {
    // Read SVG
    const svgBuffer = fs.readFileSync(iconSvg);
    
    // Generate 192x192 icon
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(__dirname, '../public/pwa-192x192.png'));
    
    // Generate 512x512 icon
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(__dirname, '../public/pwa-512x512.png'));
    
    // Generate Apple touch icon (180x180)
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(__dirname, '../public/apple-touch-icon.png'));
    
    // Generate masked icon (SVG)
    fs.copyFileSync(iconSvg, path.join(__dirname, '../public/masked-icon.svg'));
    
    console.log('✅ PWA icons generated successfully!');
    console.log('Generated files:');
    console.log('- pwa-192x192.png');
    console.log('- pwa-512x512.png');
    console.log('- apple-touch-icon.png');
    console.log('- masked-icon.svg');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
}

generateIcons();
