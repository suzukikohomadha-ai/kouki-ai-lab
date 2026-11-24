// 使い方: node render.js  （src/*.html を同じ名前のPNGとして1つ上のフォルダに書き出す）
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
(async () => {
  const dir = __dirname, out = path.join(dir, '..');
  const files = fs.readdirSync(dir).filter(f => /^図解\d+.*\.html$/.test(f));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  for (const f of files) {
    await page.goto('file://' + path.join(dir, f));
    await page.evaluate(() => document.fonts.ready);
    const el = await page.$('.canvas');
    await el.screenshot({ path: path.join(out, f.replace(/\.html$/, '.png')) });
    console.log('wrote', f.replace(/\.html$/, '.png'));
  }
  await browser.close();
})();
