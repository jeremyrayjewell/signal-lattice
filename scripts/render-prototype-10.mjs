import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';

const analysis = JSON.parse(await readFile('assets/analysis/prototype-02.json', 'utf8'));
const strong = analysis.events
  .filter((e) => e.time >= 143 && e.time < 147)
  .sort((a, b) => b.strength - a.strength)[0];
const timeline = {
  width: 960,
  height: 540,
  fps: 30,
  frames: 750,
  selection: { start: 128, end: 153, duration: 25 },
  source: analysis.source,
  source_sha256: analysis.source_sha256,
  representativeFrames: [45, 180, 330, Math.round((strong.time - 128) * 30), 615, 735],
  strongTransient: strong,
};
const output = path.resolve('renders/prototype-10'),
  frames = path.join(output, 'frames');
await mkdir(frames, { recursive: true });
const hash = (b) => createHash('sha256').update(b).digest('hex');
function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { windowsHide: true });
    let out = '',
      err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(err))));
  });
}
async function preserve() {
  const list = JSON.parse(await readFile(path.join(output, 'baseline-hashes.json'), 'utf8'));
  for (const f of list)
    if (hash(await readFile(f.path)) !== f.sha256)
      throw new Error(`Historical file changed: ${f.path}`);
}
await preserve();
const server = await createServer({
  server: { host: '127.0.0.1', port: 5173, strictPort: false, hmr: false, watch: null },
});
await server.listen();
let browser;
const errors = [];
try {
  const options = { headless: true, args: ['--disable-gpu'] };
  if (process.env.CHROME_PATH) options.executablePath = process.env.CHROME_PATH;
  else if (process.platform === 'win32') {
    const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
    try {
      await access(edge);
      options.executablePath = edge;
    } catch {}
  }
  browser = await chromium.launch(options);
  const page = await browser.newPage({
    viewport: { width: 1000, height: 700 },
    deviceScaleFactor: 1,
  });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}pages/prototype-10.html?render=1`);
  await page.waitForFunction(() => !!window.signalLattice10);
  const stateChecks = [];
  async function capture(frame, reactive = true) {
    const png = await page.evaluate(
      ({ frame, reactive }) => {
        window.signalLattice10.renderFrame(frame, reactive);
        return window.signalLattice10.png();
      },
      { frame, reactive },
    );
    return Buffer.from(png.split(',')[1], 'base64');
  }
  for (const frame of [60, 330, 660]) {
    const active = hash(await capture(frame));
    const quiet = hash(await capture(frame, false));
    if (active === quiet || quiet === hash(await capture(frame + 15, false)))
      throw new Error('Scene L music/autonomy check failed');
    stateChecks.push(await page.evaluate((f) => window.signalLattice10.renderFrame(f), frame));
  }
  const reference = hash(await capture(450));
  await capture(700);
  if (hash(await capture(450)) !== reference) throw new Error('Scene L rendering is stateful');
  if (errors.length) throw new Error(errors.join('\n'));
  await writeFile(path.join(output, 'study.json'), JSON.stringify(timeline, null, 2));
  console.log('Scene L calm/active/extreme regimes retain autonomous motion and music response.');
  for (let f = 0; f < timeline.frames; f++) {
    await writeFile(path.join(frames, `frame-${String(f).padStart(5, '0')}.png`), await capture(f));
    if ((f + 1) % 150 === 0) console.log(`Rendered ${f + 1}/${timeline.frames}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  const video = path.join(output, 'signal-lattice-10-scene-l-25s.mp4');
  console.log('Encoding the 25-second Scene L study.');
  await run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-framerate',
    '30',
    '-start_number',
    '0',
    '-i',
    path.join(frames, 'frame-%05d.png'),
    '-i',
    'assets/audio/prototype-02-excerpt.wav',
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-t',
    '25',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '320k',
    '-movflags',
    '+faststart',
    video,
  ]);
  await run('python', ['scripts/contact-prototype-10.py']);
  await preserve();
  await writeFile(
    path.join(output, 'render-report.json'),
    JSON.stringify(
      {
        timeline,
        browser: browser.version(),
        stateChecks,
        deterministicFrame: { frame: 450, sha256: reference },
        renderedFrames: timeline.frames,
        browserErrors: errors,
        historicalMilestoneUnchanged: true,
        note: 'Established synchronization pipeline reused. No basic synchronization test suite rerun.',
      },
      null,
      2,
    ),
  );
  console.log(`Complete: ${video}`);
} finally {
  await browser?.close();
  await server.close();
}
