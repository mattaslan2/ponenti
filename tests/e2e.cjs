// Smoke test of the main journeys on a local production build with no .env.local
// (forms then answer "not connected"). Run: npm run build && npm start, then npm run test:e2e.
// Uses your installed Chrome, or CHROME_PATH. BASE_URL defaults to http://localhost:3000.
const { chromium } = require('playwright-core');
const base = process.env.BASE_URL || 'http://localhost:3000';
const results = [];
const ok = (name, cond, extra = '') => { results.push({ name, pass: !!cond, extra }); };
(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: false });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${page.url()} :: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => consoleErrors.push(`${page.url()} :: pageerror ${e.message.slice(0, 200)}`));

  // 1. Home + consent
  let r = await page.goto(base + '/', { waitUntil: 'networkidle' });
  ok('bare domain redirects to /tr', page.url().endsWith('/tr'), page.url());
  ok('home H1', (await page.locator('h1').innerText()).includes('Türkçe uyum ve tahsilat masası'));
  ok('consent banner visible', await page.getByRole('button', { name: 'Kabul et' }).isVisible());
  const ingestBefore = [];
  page.on('request', (req) => { if (req.url().includes('/ingest')) ingestBefore.push(req.url()); });
  await page.getByRole('button', { name: 'Reddet' }).click();
  const cookies1 = await ctx.cookies();
  ok('decline sets cookie', cookies1.some((c) => c.name === 'ponenti_consent' && c.value === 'denied'));
  ok('banner gone after decline', !(await page.getByRole('button', { name: 'Kabul et' }).isVisible()));
  ok('no analytics requests', ingestBefore.length === 0);

  // 2. Risk test (pointer clicks auto-advance)
  await page.goto(base + '/tr/risk-testi', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Teste başlayın' }).click();
  const answers = ['Evet', 'Evet', 'Evet', 'Hayır', 'Hayır', '6-15', '1-5', '61-90 gün', 'Hayır', 'Hayır'];
  for (const a of answers) {
    await page.locator('label', { hasText: new RegExp('^' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).first().click();
    await page.waitForTimeout(450);
  }
  const resultText = await page.locator('main').innerText();
  ok('risk result high', resultText.includes('Yüksek risk'), resultText.slice(0, 120));
  ok('top risk 1 = 5472', resultText.indexOf('Eksik Form 5472 yılları') > -1);
  ok('top risk 2 = address', resultText.indexOf('İthalatçı kaydı adresi') > -1);
  ok('top risk 3 = refunds', resultText.indexOf('CBP iadeleri için banka hesabı yok') > -1);

  // 3. Email result form -> not configured
  await page.getByLabel('Ad soyad', { exact: true }).fill('Test Kişi');
  await page.getByLabel('İş e-postası').fill('test@ornek-firma.com');
  await page.getByLabel('Şirket', { exact: true }).fill('Örnek Firma');
  await page.locator('input[name="consent"]').check();
  await page.waitForTimeout(1700);
  await page.getByRole('button', { name: 'Gönder' }).click();
  await page.waitForTimeout(2500);
  const afterSubmit = await page.locator('main').innerText();
  ok('form shows not-configured message', afterSubmit.includes('Form henüz bağlanmadı'), afterSubmit.slice(afterSubmit.indexOf('Form'), afterSubmit.indexOf('Form') + 80));

  // 4. Contact form validation
  await page.goto(base + '/tr/iletisim', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Gönder' }).click();
  await page.waitForTimeout(2500);
  const contactText = await page.locator('main').innerText();
  ok('contact empty submit shows field errors', contactText.includes('Bu alan zorunludur.') && contactText.includes('Devam etmek için onay kutusunu işaretleyin.'));
  await page.getByLabel('Ad soyad', { exact: true }).fill('Test Kişi');
  await page.getByLabel('İş e-postası').fill('test@ornek-firma.com');
  await page.getByLabel('Şirket', { exact: true }).fill('Örnek Firma');
  await page.getByLabel('Mesajınız (isteğe bağlı)').fill('EIN numaramız 12-3456789');
  await page.locator('input[name="consent"]').check();
  await page.getByRole('button', { name: 'Gönder' }).click();
  await page.waitForTimeout(2500);
  ok('EIN in message refused', (await page.locator('main').innerText()).includes('Lütfen vergi kimlik numarası veya EIN paylaşmayın.'));

  // 5. Calculators
  await page.goto(base + '/tr/hesaplayicilar', { waitUntil: 'networkidle' });
  const calcText = await page.locator('main').innerText();
  ok('cash calc default $181.000', calcText.includes('$181.000'));
  ok('5472 default $75.000', calcText.includes('$75.000'));
  const sales = page.getByLabel('Yıllık ABD satışı ($)');
  await sales.click(); await sales.fill('1000000'); await sales.blur();
  await page.waitForTimeout(300);
  ok('cash calc updates to $60.000', (await page.locator('main').innerText()).includes('$60.000'));
  await page.getByRole('button', { name: 'Bir yıl artır' }).click();
  ok('5472 increments to $100.000', (await page.locator('main').innerText()).includes('$100.000'));

  // 6. Language switch on an article + remembered choice
  await page.goto(base + '/tr/bilgi-merkezi/form-5472-cezasi', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Dili değiştir: English' }).click();
  await page.waitForLoadState('networkidle');
  ok('switch goes to EN article', page.url().endsWith('/en/insights/form-5472-penalty'), page.url());
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  ok('bare domain remembers EN', page.url().endsWith('/en'), page.url());
  await page.getByRole('link', { name: 'Switch language: Türkçe' }).click();
  await page.waitForLoadState('networkidle');
  ok('switch back to TR home', page.url().endsWith('/tr'), page.url());

  // 7. Mobile menu
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.waitForTimeout(400);
  ok('mobile menu shows nav', await page.getByRole('dialog').getByRole('link', { name: 'Hizmetler ve fiyatlar' }).isVisible());
  ok('mobile menu close label TR', await page.getByRole('button', { name: 'Kapat' }).isVisible());
  ok('mobile menu focus starts inside', await page.evaluate(() => !!document.activeElement?.closest('dialog')));
  ok('mobile menu locks page scroll', await page.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden'));
  await page.getByRole('button', { name: 'Kapat' }).click();
  await page.waitForTimeout(400);
  ok('mobile menu closes', !(await page.getByRole('dialog').isVisible().catch(() => false)));
  ok('focus returns to menu button', await page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Menü'));
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  ok('mobile menu closes on Escape', !(await page.locator('dialog#mobile-menu[open]').count()));
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.waitForTimeout(300);
  await page.mouse.click(10, 300);
  await page.waitForTimeout(400);
  ok('mobile menu closes on backdrop tap', !(await page.locator('dialog#mobile-menu[open]').count()));
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.waitForTimeout(300);
  await page.getByRole('dialog').getByRole('link', { name: 'Hizmetler ve fiyatlar' }).click();
  await page.waitForURL('**/tr/hizmetler');
  await page.waitForTimeout(300);
  ok('menu link navigates and closes', page.url().endsWith('/tr/hizmetler') && !(await page.locator('dialog#mobile-menu[open]').count()), page.url());

  // 8. 404, prospect, portal
  r = await page.goto(base + '/tr/olmayan-sayfa', { waitUntil: 'load' });
  ok('404 status', r.status() === 404, String(r.status()));
  ok('404 localized', (await page.locator('h1').innerText()).includes('Bu sayfa bulunamadı'));
  r = await page.goto(base + '/tr/ozel/ornek-firma', { waitUntil: 'networkidle' });
  ok('prospect 200', r.status() === 200);
  ok('prospect noindex', (await page.locator('meta[name="robots"]').getAttribute('content'))?.includes('noindex'));
  ok('prospect sample label', (await page.locator('main').innerText()).includes('Örnek sayfa'));
  r = await page.goto(base + '/tr/portal', { waitUntil: 'networkidle' });
  ok('portal noindex', (await page.locator('meta[name="robots"]').getAttribute('content'))?.includes('noindex'));
  ok('portal has no login form', (await page.locator('input[type="password"]').count()) === 0);
  ok('portal sample label', (await page.locator('main').innerText()).includes('Örnek veriler / Sample data'));

  // 9. EN pages render
  for (const p of ['/en', '/en/services', '/en/risk-test', '/en/calculators', '/en/insights', '/en/about', '/en/contact', '/en/privacy', '/en/terms', '/en/cookies', '/tr/gizlilik', '/tr/kosullar', '/tr/cerezler', '/tr/bilgi-merkezi', '/tr/hakkimizda']) {
    r = await page.goto(base + p, { waitUntil: 'domcontentloaded' });
    ok(`200 ${p}`, r.status() === 200, String(r.status()));
  }
  // The deliberate 404 visit logs one "Failed to load resource" line; anything else is a real error.
  const realErrors = consoleErrors.filter((e) => !(e.includes('/tr/olmayan-sayfa') && e.includes('status of 404')));
  ok('no console errors', realErrors.length === 0, realErrors.slice(0, 6).join(' || '));

  await browser.close();
  const failed = results.filter((x) => !x.pass);
  for (const x of results) console.log(`${x.pass ? 'PASS' : 'FAIL'}  ${x.name}${x.pass ? '' : '  -> ' + x.extra}`);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exitCode = failed.length ? 1 : 0;
})().catch((e) => { console.error(e); process.exit(1); });
