import { chromium } from 'playwright';
import fs from 'node:fs';

const svg = fs.readFileSync('public/favicon.svg', 'utf8');
const font = fs.readFileSync('node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2').toString('base64');
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const icoImages = [];
  for (const size of [16, 32, 48, 180, 192, 512]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:100%;height:100%}</style>${size >= 180 ? svg.replace('rx="12"', 'rx="0"') : svg}`);
    const png = await page.screenshot({ omitBackground: true });
    if (size <= 48) icoImages.push({ size, png });
    const filename = size === 32 ? 'favicon-32.png' : size === 180 ? 'apple-touch-icon.png' : size >= 192 ? `icon-${size}.png` : null;
    if (filename) fs.writeFileSync(`public/${filename}`, png);
  }
  const header = Buffer.alloc(6 + icoImages.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(icoImages.length, 4);
  let offset = header.length;
  icoImages.forEach(({ size, png }, i) => {
    const entry = 6 + i * 16;
    header[entry] = size;
    header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  fs.writeFileSync('public/favicon.ico', Buffer.concat([header, ...icoImages.map(({ png }) => png)]));
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:Archivo;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900}
    *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#f4f2eb;color:#232820;font-family:Archivo,sans-serif;padding:48px 64px;position:relative;overflow:hidden}
    .plane{position:absolute;right:0;top:0;width:390px;height:630px;background:#e8ecdf;clip-path:polygon(100% 0,100% 100%,0 100%);z-index:-1}body{isolation:isolate}
    header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #d3d5c9;padding-bottom:24px}.mark{font-size:48px;font-weight:850;letter-spacing:-4px}.mark span{color:#244fd8;font-size:30px;letter-spacing:0;margin-left:5px}.address{font-size:20px}
    .name{font-size:29px;font-weight:650;margin:32px 0 8px;letter-spacing:-.7px}.role{font-size:20px;color:#62675c;margin:0}
    h1{font-size:92px;font-weight:750;line-height:.98;letter-spacing:-6px;margin:30px 0 24px}h1 span{color:#244fd8}
    footer{position:absolute;bottom:43px;left:64px;right:64px;display:flex;justify-content:space-between;border-top:1px solid #d3d5c9;padding-top:20px;font-size:19px;color:#62675c}
  </style></head><body><div class="plane"></div><header><div class="mark">ub<span>↗</span></div><span class="address">usmanbutt.dev</span></header><p class="name">Muhammad Usman Butt</p><p class="role">Software Engineer · Lahore, Pakistan</p><h1>Ideas.<br>Made <span>interactive.</span></h1><footer><span>Unity &amp; VR · Web &amp; mobile · AI systems</span><span>Selected work &amp; experience ↗</span></footer></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'public/images/social-card.png' });
  console.log('Generated favicon fallbacks, mobile icons, and 1200×630 social card.');
} finally {
  await browser.close();
}
