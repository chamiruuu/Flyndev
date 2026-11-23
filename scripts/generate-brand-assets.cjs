/**
 * Generates the favicon set and the Open Graph image from the brand logo files.
 *
 * Dev-only tool. Playwright is NOT a project dependency; run it with a global install:
 *   NODE_PATH=$(npm root -g) node scripts/generate-brand-assets.cjs
 *
 * Inputs : assets/brand-src/f-mark.svg (the F), public/brand/logo.svg (full logo)
 * Outputs: app/favicon.ico, app/icon.png, app/apple-icon.png,
 *          app/opengraph-image.png, app/twitter-image.png
 * The OG image loads JetBrains Mono from Google Fonts, so it needs network access.
 */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.join(__dirname, "..");
const dataUri = (rel) =>
  "data:image/svg+xml;base64," + fs.readFileSync(path.join(root, rel)).toString("base64");

const fMark = dataUri("assets/brand-src/f-mark.svg");
const wordmark = dataUri("public/brand/logo.svg");

const BG = "#050505";
const ACCENT = "#f4511e";

/** A square tile: dark background, F-mark centred. `radius` is a fraction of the size. */
const iconHtml = (
  size,
  { radius, fill },
) => `<!doctype html><html><body style="margin:0;background:transparent">
<div style="width:${size}px;height:${size}px;background:${BG};border-radius:${Math.round(size * radius)}px;
  display:grid;place-items:center;overflow:hidden">
  <img src="${fMark}" style="width:${Math.round(size * fill)}px;height:auto;display:block">
</div></body></html>`;

const ogHtml = `<!doctype html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&display=swap">
<style>
  html,body{margin:0;width:1200px;height:630px;background:${BG};overflow:hidden}
  .grid{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(246,239,231,.06) 1px,transparent 1.5px);background-size:32px 32px}
  .circle{position:absolute;width:2600px;height:2600px;left:${1200 - 1300}px;top:488px;border-radius:50%;
    background:${BG};border:2px solid ${ACCENT};
    box-shadow:0 0 60px 2px rgba(244,81,30,.40),0 0 160px 12px rgba(244,81,30,.16)}
  .wm{position:absolute;left:50%;top:196px;width:760px;transform:translateX(-50%)}
  .cap{position:absolute;left:0;right:0;top:372px;text-align:center;
    font:500 20px/1 "JetBrains Mono",monospace;letter-spacing:.14em;color:#8c857e;text-transform:uppercase}
</style></head><body>
  <div class="grid"></div>
  <div class="circle"></div>
  <img class="wm" src="${wordmark}">
  <div class="cap">Web · Systems · Automation — Coming soon</div>
</body></html>`;

async function shot(browser, html, { width, height, out, transparent = false }) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.screenshot({ type: "png", omitBackground: transparent });
  await page.close();
  if (out) fs.writeFileSync(path.join(root, out), buf);
  return buf;
}

/** Hand-built .ico containing PNG images (supported by every current browser). */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, buf }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // palette colours
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buf.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.buf)]);
}

(async () => {
  const browser = await chromium.launch();

  await shot(browser, iconHtml(512, { radius: 0.22, fill: 0.62 }), {
    width: 512,
    height: 512,
    out: "app/icon.png",
    transparent: true,
  });
  await shot(browser, iconHtml(180, { radius: 0, fill: 0.62 }), {
    width: 180,
    height: 180,
    out: "app/apple-icon.png",
  });

  const icoImages = [];
  for (const size of [16, 32, 48]) {
    const buf = await shot(browser, iconHtml(size, { radius: 0.2, fill: 0.8 }), {
      width: size,
      height: size,
      transparent: true,
    });
    icoImages.push({ size, buf });
  }
  fs.writeFileSync(path.join(root, "app/favicon.ico"), buildIco(icoImages));

  const og = await shot(browser, ogHtml, { width: 1200, height: 630 });
  fs.writeFileSync(path.join(root, "app/opengraph-image.png"), og);
  fs.writeFileSync(path.join(root, "app/twitter-image.png"), og);

  await browser.close();
  console.log("Brand assets written to app/");
})();
