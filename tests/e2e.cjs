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

  // 8. Trade data. Figures come from the committed snapshot; without CENSUS_API_KEY only the live
  // parts (another partner's monthly line and ports) say the data isn't connected.
  r = await page.goto(base + '/tr/ticaret-verileri', { waitUntil: 'networkidle', timeout: 60000 });
  ok('trade page 200', r.status() === 200, String(r.status()));
  const tradeText = await page.locator('main').innerText();
  {
    ok('trade overview KPIs', /\$[\d.,]+ milyar/.test(tradeText) && tradeText.includes('Türkiye çıkışlı ABD ithalatı'), tradeText.slice(0, 200));
    ok('trade overview lists products', (await page.locator('main ol li a[href*="/tr/ticaret-verileri/"]').count()) >= 10);
    const slider = page.getByRole('slider').first();
    await slider.focus();
    const before = await slider.getAttribute('aria-valuetext');
    await page.keyboard.press('ArrowLeft');
    ok('chart scrubber moves by keyboard', (await slider.getAttribute('aria-valuetext')) !== before, before);
    const search = page.getByRole('combobox', { name: 'Ürün veya GTİP kodu' });
    await search.fill('fındık');
    await page.getByRole('option').first().waitFor({ timeout: 10000 });
    ok('search suggests hazelnuts', (await page.getByRole('option').first().innerText()).includes('080222'));
    await page.getByRole('option').first().click();
    await page.waitForURL('**/tr/ticaret-verileri/080222', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    ok('search opens product page', page.url().endsWith('/tr/ticaret-verileri/080222'), page.url());
    await page.goto(base + '/tr/ticaret-verileri/5702', { waitUntil: 'networkidle', timeout: 60000 });
    const productText = await page.locator('main').innerText();
    ok('product page suppliers', productText.includes('En büyük tedarikçiler') && productText.includes('Türkiye'));
    await page.getByLabel('Kaynak ülke').selectOption('IN');
    await page.waitForURL('**/tr/ticaret-verileri/5702?country=IN', { timeout: 30000 });
    const switched = await page.getByText('Hindistan çıkışlı, son 12 ay').first().waitFor({ timeout: 45000 }).then(() => true, () => false);
    ok('country switch', switched, page.url());
    // Partners other than Türkiye: the monthly line arrives live, after the snapshot figures.
    const liveLine = page.getByRole('slider', { name: /^Hindistan çıkışlı\./ });
    const liveOk = await liveLine.waitFor({ timeout: 60000 }).then(() => true, () => false);
    const liveFallback = (await page.getByText(/Bu bölüm şu anda yüklenemedi|henüz bağlanmadı/).count()) > 0;
    ok('live monthly line for a non-Türkiye partner', liveOk || liveFallback, liveOk ? 'live' : 'fallback message');
    await page.goBack();
    await page.waitForURL(/\/tr\/ticaret-verileri\/5702$/, { timeout: 30000 });
    const restored = await page.getByText('Türkiye çıkışlı, son 12 ay').first().waitFor({ timeout: 45000 }).then(() => true, () => false);
    const selected = await page.getByLabel('Kaynak ülke').inputValue();
    ok('Back restores the country and the selector', restored && selected === 'TR', selected);
    const countryFocused = page.getByLabel('Kaynak ülke');
    await countryFocused.focus();
    await countryFocused.selectOption('DE');
    await page.waitForURL('**/tr/ticaret-verileri/5702?country=DE', { timeout: 30000 });
    await page.getByText('Almanya çıkışlı, son 12 ay').first().waitFor({ timeout: 45000 }).catch(() => {});
    ok('selector keeps focus after a country change', await countryFocused.evaluate((el) => el === document.activeElement));
    r = await page.goto(base + '/tr/ticaret-verileri?q=zeytinya%C4%9F%C4%B1', { waitUntil: 'load' });
    ok('search works without JavaScript (GET ?q=)', (await page.locator('#trade-search-title').innerText()).includes('zeytinyağı') && (await page.locator('main').innerText()).includes('1509'));
    r = await page.goto(base + '/tr/ticaret-verileri/5702429020', { waitUntil: 'load' });
    ok('10-digit HTS code redirects to HS6', page.url().endsWith('/tr/ticaret-verileri/570242'), page.url());
  }

  // 9. 404, prospect, portal
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
  // 10. Icons and share images are served (the Apple touch icon has no extension and must skip the language proxy)
  for (const [p, type] of [['/apple-icon', 'image/png'], ['/icon.svg', 'image/svg+xml'], ['/tr/opengraph-image', 'image/png'], ['/en/opengraph-image', 'image/png']]) {
    const res = await ctx.request.get(base + p);
    ok(`${p} is an image`, res.status() === 200 && (res.headers()['content-type'] || '').includes(type), `${res.status()} ${res.headers()['content-type']}`);
  }
  await page.goto(base + '/tr', { waitUntil: 'domcontentloaded' });
  const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent());
  const logoUrl = (ld['@graph'] || []).map((n) => n.logo).find(Boolean);
  const logoRes = logoUrl ? await ctx.request.get(base + new URL(logoUrl).pathname) : null;
  ok('structured-data logo is served', !!logoRes && logoRes.status() === 200 && (logoRes.headers()['content-type'] || '').includes('image/'), `${logoRes && logoRes.status()} ${logoUrl}`);
  await page.goto(base + '/tr/bilgi-merkezi/form-5472-cezasi', { waitUntil: 'domcontentloaded' });
  const ogUrl = await page.locator('meta[property="og:image"]').getAttribute('content');
  const ogRes = await ctx.request.get(base + new URL(ogUrl).pathname);
  ok('article share image is served', ogRes.status() === 200 && (ogRes.headers()['content-type'] || '').includes('image/png'), `${ogRes.status()} ${ogUrl}`);

  // 11. Nothing a visitor reads is a placeholder or names a channel that is not connected
  for (const p of ['/tr', '/tr/hizmetler', '/tr/hakkimizda', '/tr/iletisim', '/en', '/en/contact']) {
    await page.goto(base + p, { waitUntil: 'domcontentloaded' });
    const text = await page.locator('body').innerText();
    ok(`no placeholder markers on ${p}`, !/\[(REPLACE WITH REAL|confirm)/i.test(text), (text.match(/\[(REPLACE WITH REAL|confirm)[^\]]*\]/i) || [''])[0]);
    const hasWhatsappLink = (await page.locator('a[href^="https://wa.me/"]').count()) > 0;
    ok(`WhatsApp is named only when it is connected on ${p}`, hasWhatsappLink || !/whatsapp/i.test(text));
  }
  // The proof section counts only cards it shows: three, or four once the founder's LinkedIn is set.
  await page.goto(base + '/tr', { waitUntil: 'domcontentloaded' });
  const proofCards = await page.locator('#proof li').count();
  const proofTitle = await page.locator('#proof-title').innerText();
  ok('proof section title matches its cards', (proofCards === 3 && proofTitle.includes('üç')) || (proofCards === 4 && proofTitle.includes('dört')), `${proofCards} cards, "${proofTitle}"`);

  // The deliberate 404 visit logs one "Failed to load resource" line; anything else is a real error.
  const realErrors = consoleErrors.filter((e) => !(e.includes('/tr/olmayan-sayfa') && e.includes('status of 404')));
  ok('no console errors', realErrors.length === 0, realErrors.slice(0, 6).join(' || '));

  await browser.close();
  const failed = results.filter((x) => !x.pass);
  for (const x of results) console.log(`${x.pass ? 'PASS' : 'FAIL'}  ${x.name}${x.pass ? '' : '  -> ' + x.extra}`);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exitCode = failed.length ? 1 : 0;
})().catch((e) => { console.error(e); process.exit(1); });
