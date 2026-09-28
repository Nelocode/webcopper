import puppeteer from 'puppeteer';

async function main() {
  console.log('🚀 Launching browser to capture authentic CRM screenshots...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Directory View
  await page.screenshot({ path: 'public/manual_images/01_directorio_360.png' });
  console.log('📸 Captured 01_directorio_360.png');

  // 2. Open 360° Dossier Modal
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && (text.includes('360°') || text.includes('Profile'))) {
      await btn.click();
      await new Promise((r) => setTimeout(r, 1200));
      break;
    }
  }
  await page.screenshot({ path: 'public/manual_images/02_expediente_360.png' });
  console.log('📸 Captured 02_expediente_360.png');

  // Close modal via Escape
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 600));

  // 3. Tab 2: Follow-up Pipeline & Task Management (Kanban)
  const navItems = await page.$$('button, a, div');
  for (const item of navItems) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text && (text.includes('Pipeline') || text.includes('Kanban') || text.includes('Follow-up'))) {
      await item.click();
      await new Promise((r) => setTimeout(r, 1200));
      break;
    }
  }
  await page.screenshot({ path: 'public/manual_images/03_embudo_kanban.png' });
  console.log('📸 Captured 03_embudo_kanban.png');

  // 4. Tab 3: Interactive Relationship Graph
  const allBtns = await page.$$('button, div');
  for (const item of allBtns) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text && (text.includes('Graph') || text.includes('Physics') || text.includes('Interactive Relationship'))) {
      await item.click();
      await new Promise((r) => setTimeout(r, 1500));
      break;
    }
  }
  await page.screenshot({ path: 'public/manual_images/04_grafo_interactivo.png' });
  console.log('📸 Captured 04_grafo_interactivo.png');

  // 5. Tab 4: Social Media & AI Post Studio
  for (const item of allBtns) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text && (text.includes('Social') || text.includes('Calendar') || text.includes('Content'))) {
      await item.click();
      await new Promise((r) => setTimeout(r, 1200));
      break;
    }
  }
  await page.screenshot({ path: 'public/manual_images/05_redes_sociales_ia.png' });
  console.log('📸 Captured 05_redes_sociales_ia.png');

  // 6. Tab 5: WhatsApp Center & Command Sandbox
  for (const item of allBtns) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text && (text.includes('WhatsApp') || text.includes('Center') || text.includes('Bot'))) {
      await item.click();
      await new Promise((r) => setTimeout(r, 1200));
      break;
    }
  }
  await page.screenshot({ path: 'public/manual_images/06_centro_whatsapp.png' });
  console.log('📸 Captured 06_centro_whatsapp.png');

  // 7. Sidebar & Branding Screenshot (crop)
  await page.screenshot({ path: 'public/manual_images/07_sidebar_branding.png', clip: { x: 0, y: 0, width: 280, height: 900 } });
  console.log('📸 Captured 07_sidebar_branding.png');

  await browser.close();
  console.log('✅ All authentic CRM screenshots captured successfully!');
}

main().catch(console.error);
