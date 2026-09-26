// Renders many-lights.html to an MP4, frame-exact with its soundtrack.
//   NODE_PATH=$(npm root -g) FFMPEG=/path/to/ffmpeg node render.cjs [out.mp4] [--frames a:b] [--stills 10,40,...]
const path = require('path');
const fs = require('fs');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const out = path.resolve(args.find(a => a.endsWith('.mp4')) || path.join(__dirname, 'many-lights.mp4'));
const workDir = path.resolve(opt('--work') || path.join(__dirname, '.render'));
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FPS = 30, DUR = 112;
fs.mkdirSync(workDir, { recursive: true });

// Fonts come from Google Fonts; fetch them with curl (which honours the system proxy/CA) and serve them to the page.
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const cache = new Map();
function fetchCached(url) {
  if (!cache.has(url)) cache.set(url, execFileSync('curl', ['-sSL', '-A', UA, url], { maxBuffer: 1 << 26 }));
  return cache.get(url);
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.error('[page error]', e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, route => {
    const url = route.request().url();
    try {
      const body = fetchCached(url);
      const type = url.includes('googleapis') ? 'text/css' : 'font/woff2';
      route.fulfill({ status: 200, body, headers: { 'content-type': type, 'access-control-allow-origin': '*' } });
    } catch (e) { route.abort(); }
  });
  await page.goto('file://' + path.join(__dirname, 'many-lights.html') + '#export');
  await page.waitForFunction(() => window.ML && window.ML.ready, null, { timeout: 60000 });
  console.log('fonts:', await page.evaluate(() => document.fonts.check('italic 500 150px "Cormorant Garamond"')));

  const stills = opt('--stills');
  if (stills) {
    const want = stills.split(',').map(Number).sort((a, b) => a - b);
    await page.evaluate(() => ML.exportBegin());
    let f = 0;
    for (const s of want) {
      const target = Math.round(s * FPS);
      for (; f < target; f++) await page.evaluate(i => { ML.exportFrame(i); }, f);
      const b64 = await page.evaluate(i => ML.exportFrame(i), f++);
      fs.writeFileSync(path.join(workDir, `still-${String(s).padStart(5, '0')}.jpg`), Buffer.from(b64, 'base64'));
      console.log('still', s);
    }
    await browser.close();
    return;
  }

  console.time('audio');
  const chunks = await page.evaluate(() => ML.prepareWav());
  const parts = [];
  for (let i = 0; i < chunks; i++) parts.push(Buffer.from(await page.evaluate(i => ML.wavChunk(i), i), 'base64'));
  const wav = path.join(workDir, 'many-lights.wav');
  fs.writeFileSync(wav, Buffer.concat(parts));
  console.timeEnd('audio');
  console.log(JSON.stringify(await page.evaluate(() => ML.stats())));
  if (args.includes('--audio-only')) { await browser.close(); return; }

  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-tune', 'grain', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  await page.evaluate(() => ML.exportBegin());
  const total = Math.round(DUR * FPS);
  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    const b64 = await page.evaluate(i => ML.exportFrame(i), f);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(`frame ${f}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('wrote', out);
})();
