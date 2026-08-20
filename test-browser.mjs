import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
  
  await page.goto('http://127.0.0.1:5173');
  
  // Wait a bit to let scripts run
  await new Promise(r => setTimeout(r, 2000));
  
  // Get dimensions of #plasma-wave-container
  const dimensions = await page.evaluate(() => {
    const el = document.getElementById('plasma-wave-container');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const canvas = el.querySelector('canvas');
    return {
      container: { width: rect.width, height: rect.height },
      canvas: canvas ? { width: canvas.width, height: canvas.height, styleWidth: canvas.style.width, styleHeight: canvas.style.height } : null
    };
  });
  console.log('DIMENSIONS:', JSON.stringify(dimensions));
  
  await browser.close();
})();
