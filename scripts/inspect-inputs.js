const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  // Wait for input
  await page.waitForSelector('input');
  
  // Click register tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const regTab = tabs.find(t => t.textContent.includes('Đăng ký'));
    if (regTab) regTab.click();
  });
  
  // Wait for 4 inputs
  await page.waitForFunction(() => document.querySelectorAll('input').length === 4);
  
  const inputsInfo = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      id: i.id,
      placeholder: i.placeholder,
      value: i.value,
      visible: i.offsetWidth > 0 && i.offsetHeight > 0
    }));
  });
  
  console.log('Inputs info:', JSON.stringify(inputsInfo, null, 2));
  
  // Let's try typing using page.type
  console.log('Typing into the first input...');
  const firstId = inputsInfo[0].id;
  await page.type('#' + firstId, 'Hello World');
  
  // Check the value now
  const val = await page.evaluate((id) => document.getElementById(id).value, firstId);
  console.log('Value after page.type:', val);
  
  await browser.close();
})();
