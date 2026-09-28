import { chromium } from 'playwright';

async function capture() {
  console.log('🚀 Launching installed Chrome via Playwright...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });
  
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log('🌐 Navigating to http://127.0.0.1:3005...');
  await page.goto('http://127.0.0.1:3005', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'public/manual_images/01_live_directorio.png' });
  console.log('📸 Captured 01_live_directorio.png!');
  
  await browser.close();
}

capture().catch(console.error);
