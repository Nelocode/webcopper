import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outputDir = path.resolve(process.cwd(), 'public/manual_images');

async function captureAll() {
  console.log('🚀 Launching Chrome via Puppeteer against Production Server (http://127.0.0.1:3009)...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3009', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Directorio General
  await page.screenshot({ path: path.join(outputDir, '01_directorio_360.png') });
  console.log('📸 Captured 01_directorio_360.png');

  // 2. Open 360° Profile Modal
  const buttons = await page.$$('button');
  let openedModal = false;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && (text.includes('360°') || text.includes('Profile'))) {
      await btn.click();
      await new Promise(r => setTimeout(r, 1500));
      openedModal = true;
      break;
    }
  }
  await page.screenshot({ path: path.join(outputDir, '02_expediente_360.png') });
  console.log('📸 Captured 02_expediente_360.png');

  if (openedModal) {
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));
  }

  // 3. Tab 2: Follow-up Pipeline & Task Management (Kanban)
  const navItems = await page.$$('button');
  for (const item of navItems) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text && (text.includes('Pipeline') || text.includes('Kanban') || text.includes('Follow-up'))) {
      await item.click();
      await new Promise(r => setTimeout(r, 1500));
      break;
    }
  }
  await page.screenshot({ path: path.join(outputDir, '03_embudo_kanban.png') });
  console.log('📸 Captured 03_embudo_kanban.png');

  // 4. Tab 3: Interactive Relationship Graph
  const navItems2 = await page.$$('button');
  for (const item of navItems2) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text && (text.includes('Graph') || text.includes('Physics') || text.includes('Interactive Relationship'))) {
      await item.click();
      await new Promise(r => setTimeout(r, 1500));
      break;
    }
  }
  await page.screenshot({ path: path.join(outputDir, '04_grafo_interactivo.png') });
  console.log('📸 Captured 04_grafo_interactivo.png');

  // 5. Tab 4: Social Media & AI Post Studio
  const navItems3 = await page.$$('button');
  for (const item of navItems3) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text && (text.includes('Social') || text.includes('Calendar') || text.includes('Content'))) {
      await item.click();
      await new Promise(r => setTimeout(r, 1500));
      break;
    }
  }
  await page.screenshot({ path: path.join(outputDir, '05_redes_sociales_ia.png') });
  console.log('📸 Captured 05_redes_sociales_ia.png');

  // 6. Tab 5: WhatsApp Center & Command Sandbox
  const navItems4 = await page.$$('button');
  for (const item of navItems4) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text && (text.includes('WhatsApp') || text.includes('Center') || text.includes('Bot'))) {
      await item.click();
      await new Promise(r => setTimeout(r, 1500));
      break;
    }
  }
  await page.screenshot({ path: path.join(outputDir, '06_centro_whatsapp.png') });
  console.log('📸 Captured 06_centro_whatsapp.png');

  // 7. Sidebar Crop
  await page.screenshot({ path: path.join(outputDir, '07_sidebar_branding.png'), clip: { x: 0, y: 0, width: 280, height: 900 } });
  console.log('📸 Captured 07_sidebar_branding.png');

  await browser.close();
  console.log('✅ ALL Screenshots from live production build captured!');
}

captureAll().catch(console.error);
