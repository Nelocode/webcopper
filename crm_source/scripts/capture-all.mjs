import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = '"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"';
const outputDir = path.resolve(process.cwd(), 'public/manual_images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🚀 Capturing real CRM screenshots from http://localhost:3001...');

try {
  // 1. Directorio General
  execSync(`${chromePath} --headless --disable-gpu --virtual-time-budget=2000 --window-size=1440,900 --user-data-dir="/tmp/chrome_scr_1" --screenshot="${outputDir}/01_directorio_360.png" "http://localhost:3001"`, { timeout: 10000 });
  console.log('📸 Captured 01_directorio_360.png');

  // 2. Sidebar Branding
  execSync(`${chromePath} --headless --disable-gpu --virtual-time-budget=2000 --window-size=1440,900 --user-data-dir="/tmp/chrome_scr_2" --screenshot="${outputDir}/07_sidebar_branding.png" "http://localhost:3001"`, { timeout: 10000 });
  console.log('📸 Captured 07_sidebar_branding.png');

  console.log('✅ Real CRM Screenshots updated!');
} catch (e) {
  console.error('Finished capture step:', e.message);
}
