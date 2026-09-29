import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.SITE_URL || 'http://127.0.0.1:4321';
const canonicalBase = 'https://www.usmanbutt.dev';
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const route of ['/', '/projects/']) {
    await page.goto(base + route, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('title').count(), 1);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), canonicalBase + route);
    assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), canonicalBase + route);
    assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'), await page.title());
    assert.equal(await page.locator('meta[property="og:description"]').getAttribute('content'), await page.locator('meta[name="description"]').getAttribute('content'));
    assert.equal(await page.locator('meta[name="twitter:card"]').getAttribute('content'), 'summary_large_image');
    assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'), canonicalBase + '/images/social-card.png');
    assert.ok(await page.locator('meta[property="og:image:alt"]').getAttribute('content'));
    assert.equal(await page.locator('vercel-analytics').count(), 1);
    for (const href of await page.locator('link[rel="icon"],link[rel="apple-touch-icon"],link[rel="manifest"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))) {
      const response = await page.request.get(base + href);
      assert.equal(response.status(), 200, href);
    }
  }
  for (const [path, width, height] of [['/favicon-32.png', 32, 32], ['/apple-touch-icon.png', 180, 180], ['/icon-192.png', 192, 192], ['/icon-512.png', 512, 512], ['/images/social-card.png', 1200, 630]]) {
    const response = await page.request.get(base + path);
    assert.equal(response.status(), 200, path);
    assert.match(response.headers()['content-type'], /image\/png/);
    const bytes = await response.body();
    assert.equal(bytes.readUInt32BE(16), width, path);
    assert.equal(bytes.readUInt32BE(20), height, path);
  }
  const ico = await (await page.request.get(base + '/favicon.ico')).body();
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  const manifest = await (await page.request.get(base + '/site.webmanifest')).json();
  assert.equal(manifest.icons.length, 2);
  for (const icon of manifest.icons) assert.equal((await page.request.get(base + icon.src)).status(), 200);
  const sitemap = await (await page.request.get(base + '/sitemap.xml')).text();
  for (const route of ['/', '/projects/']) assert.ok(sitemap.includes(`<loc>${canonicalBase}${route}</loc>`));
  const robots = await (await page.request.get(base + '/robots.txt')).text();
  assert.ok(robots.includes(`Sitemap: ${canonicalBase}/sitemap.xml`));
  assert.deepEqual(errors, []);
  console.log('PASS: both pages have consistent metadata, accessible icons, correct image sizes, canonical URLs, and analytics.');
} finally {
  await browser.close();
}
