// Accessibility scan (axe-core, WCAG 2.2 AA + best practice + experimental rules) of 18 pages
// at 390 px and 1280 px. Run against a local production build: npm run test:a11y.
const { chromium } = require('playwright-core');
const { AxeBuilder } = require('@axe-core/playwright');
const base = process.env.BASE_URL || 'http://localhost:3000';
const pages = ['/tr', '/tr/hizmetler', '/tr/risk-testi', '/tr/hesaplayicilar', '/tr/bilgi-merkezi', '/tr/bilgi-merkezi/eo-14411-ithalatci-kaydi-kurallari', '/tr/hakkimizda', '/tr/iletisim', '/tr/gizlilik', '/tr/cerezler', '/tr/portal', '/tr/ozel/ornek-firma', '/tr/yok', '/en', '/en/services', '/en/contact', '/en/insights/sales-tax-nexus-by-state', '/en/about'];
(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
  let total = 0;
  for (const width of [390, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    for (const p of pages) {
      await page.goto(base + p, { waitUntil: 'load' });
      await page.waitForTimeout(300);
      await page.evaluate(() => document.querySelectorAll('[data-pending]').forEach((e) => { delete e.dataset.pending; e.dataset.shown = ''; }));
      await page.waitForTimeout(500);
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice', 'experimental']).analyze();
      const v = res.violations;
      total += v.length;
      if (v.length) {
        console.log(`\n${width}px ${p}: ${v.length} violation types`);
        for (const x of v) console.log(`  [${x.impact}] ${x.id}: ${x.help} (${x.nodes.length}) e.g. ${x.nodes[0].target.join(' ')} :: ${(x.nodes[0].failureSummary||'').split('\n').slice(1,2).join(' ').slice(0,160)}`);
      }
    }
    await ctx.close();
  }
  console.log(`\nTotal violation types across pages: ${total}`);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
