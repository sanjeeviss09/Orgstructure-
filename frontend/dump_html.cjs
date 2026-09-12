const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('PAGE EXCEPTION:', error.message));
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 });
    const html = await page.content();
    console.log('HTML DUMP:');
    console.log(html);
  } catch (err) {
    console.error('Failed to load:', err.message);
  }

  await browser.close();
})();
