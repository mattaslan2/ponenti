// Lead flow against mock Attio and Resend APIs. Start the mock (node tests/mock-apis.cjs),
// then start the site with ATTIO_API_KEY=test ATTIO_API_URL=http://localhost:4010/v2
// RESEND_API_KEY=re_test RESEND_BASE_URL=http://localhost:4010 LEADS_FROM_EMAIL=... LEADS_ALERT_EMAIL=...
// and run npm run test:leads. Prints every request the site sent.
// End-to-end lead flow against the mock Attio/Resend server (mock-apis.cjs).
const { chromium } = require('playwright-core');
const fs = require('fs');
const base = process.env.BASE_URL || 'http://localhost:3000';
(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addCookies([{ name: 'ponenti_consent', value: 'denied', url: base }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  // 1. Contact form, TR, with UTM tags and a company email domain
  await page.goto(base + '/tr/iletisim?utm_source=cold_email&utm_medium=email&utm_campaign=ekim26', { waitUntil: 'networkidle' });
  await page.getByLabel('Ad soyad', { exact: true }).fill('Ayşe Yılmaz');
  await page.getByLabel('İş e-postası').fill('ayse@acme-tekstil.com.tr');
  await page.getByLabel('Şirket', { exact: true }).fill('Acme Tekstil A.Ş.');
  await page.getByLabel('Telefon (isteğe bağlı)').fill('+90 532 123 45 67');
  await page.getByLabel("ABD'ye Türkiye'den satıyorum").check();
  await page.locator('select[name="paymentDays"]').selectOption('61-90');
  await page.getByLabel('Mesajınız (isteğe bağlı)').fill('Merhaba, tahsilat masası için görüşmek isteriz.');
  await page.locator('input[name="consent"]').check();
  await page.waitForTimeout(1700);
  await page.getByRole('button', { name: 'Gönder' }).click();
  await page.waitForTimeout(3000);
  console.log('contact success panel:', (await page.locator('main').innerText()).includes('Teşekkürler.'));

  // 2. Risk test, TR, free email domain (company found by name or created)
  await page.goto(base + '/tr/risk-testi', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Teste başlayın' }).click();
  for (const a of ['Evet', 'Evet', 'Evet', 'Hayır', 'Hayır', '6-15', '1-5', '61-90 gün', 'Hayır', 'Hayır']) {
    await page.locator('label', { hasText: new RegExp('^' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).first().click();
    await page.waitForTimeout(450);
  }
  await page.getByLabel('Ad soyad', { exact: true }).fill('Mehmet Öztürk');
  await page.getByLabel('İş e-postası').fill('mehmet.ozturk@gmail.com');
  await page.getByLabel('Şirket', { exact: true }).fill('Öztürk Mobilya');
  await page.locator('input[name="consent"]').check();
  await page.waitForTimeout(1700);
  await page.getByRole('button', { name: 'Gönder' }).click();
  await page.waitForTimeout(3000);
  console.log('risk success panel:', (await page.locator('main').innerText()).includes('Teşekkürler.'));

  // 3. Cash calculator, EN
  await page.goto(base + '/en/calculators', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /email/i }).first().click();
  await page.waitForTimeout(300);
  const form = page.locator('form').first();
  await form.getByLabel('Full name', { exact: true }).fill('John Carter');
  await form.getByLabel('Work email').fill('john@carter-imports.com');
  await form.getByLabel('Company', { exact: true }).fill('Carter Imports LLC');
  await form.locator('input[name="consent"]').check();
  await page.waitForTimeout(1700);
  await form.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  console.log('calc success panel:', (await page.locator('main').innerText()).includes('Thank you'));
  console.log('page errors:', errors);
  await browser.close();

  const log = fs.readFileSync(require('os').tmpdir() + '/ponenti-mock-log.jsonl', 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  for (const r of log) {
    const b = r.body || {};
    if (r.url.startsWith('/emails')) {
      console.log(`\n--- ${r.method} ${r.url} to=${b.to} replyTo=${b.reply_to || b.replyTo} subject=${b.subject}\n${b.text}`);
    } else {
      console.log(`\n--- ${r.method} ${r.url} auth=${r.auth}\n${JSON.stringify(b, null, 1).slice(0, 1600)}`);
    }
  }
})();
