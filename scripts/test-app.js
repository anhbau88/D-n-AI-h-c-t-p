// scripts/test-app.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Starting Puppeteer test...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set viewport to desktop size
  await page.setViewport({ width: 1280, height: 800 });

  // Capture page console logs
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));

  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log('Page loaded successfully. Taking initial screenshot...');
    const screenshotDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\b6d49b56-876d-4524-8d0f-ee85e0e64ee6';
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    await page.screenshot({ path: path.join(screenshotDir, 'screenshot_initial.png') });
    console.log('Initial screenshot saved to screenshot_initial.png');

    // Print page title
    const title = await page.title();
    console.log('Page Title:', title);

    // Print form input fields to inspect what is rendered
    const inputs = await page.evaluate(() => {
      const formInputs = Array.from(document.querySelectorAll('input, select, button, label'));
      return formInputs.map(el => ({
        tagName: el.tagName,
        type: el.type || null,
        placeholder: el.placeholder || null,
        textContent: el.textContent?.trim() || null,
        id: el.id || null,
        className: el.className || null
      }));
    });
    console.log('Found elements on page:', JSON.stringify(inputs, null, 2));

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
    console.log('Puppeteer test finished.');
  }
})();
