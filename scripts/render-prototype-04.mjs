import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';

const timeline = JSON.parse(await readFile('assets/analysis/prototype-04-timeline.json', 'utf8'));
const output = path.resolve('renders/prototype-04'),
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
const server = await createServer({ server: { host: '127.0.0.1', port: 5173, strictPort: false } });
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
  await page.goto(`${server.resolvedUrls.local[0]}pages/prototype-04.html?render=1`);
  await page.waitForFunction(() => !!window.signalLattice04);
  const stateChecks = [];
  // New functionality only: each family supports visibly distinct interpolated regimes.
  for (const scene of 'ABCDEFGH') {
    const hashes = [];
    for (const state of ['CALM', 'ACTIVE', 'EXTREME']) {
      const png = await page.evaluate(
        ({ scene, state }) => {
          window.signalLattice04.renderFamily(scene, 600, state);
          return window.signalLattice04.png();
        },
        { scene, state },
      );
      hashes.push(hash(png));
    }
    if (new Set(hashes).size !== 3) throw new Error(`State regimes identical for ${scene}`);
    stateChecks.push({ scene, distinctStates: true });
  }
  async function capture(frame) {
    const png = await page.evaluate((f) => {
      window.signalLattice04.renderFrame(f);
      return window.signalLattice04.png();
    }, frame);
    return Buffer.from(png.split(',')[1], 'base64');
  }
  const structural = timeline.clips.find((c) => c.transition?.type === 'structural');
  const handoffFrame = structural.startFrame + 36;
  const handoffHash = hash(await capture(handoffFrame));
  await capture(2000);
  if (hash(await capture(handoffFrame)) !== handoffHash)
    throw new Error('Structural handoff is stateful');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(
    'All eight families have distinct calm/active/extreme states; geometry handoff is deterministic.',
  );
  for (let f = 0; f < timeline.frames; f++) {
    await writeFile(path.join(frames, `frame-${String(f).padStart(5, '0')}.png`), await capture(f));
    if ((f + 1) % 150 === 0) console.log(`Rendered ${f + 1}/${timeline.frames}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  const video = path.join(output, 'signal-lattice-04-75s.mp4');
  console.log('Encoding the 75-second scene-bank study.');
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
    'assets/audio/prototype-04-excerpt.wav',
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-t',
    '75',
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
  await run('python', ['scripts/contact-prototype-04.py']);
  await preserve();
  await writeFile(
    path.join(output, 'render-report.json'),
    JSON.stringify(
      {
        timeline,
        browser: browser.version(),
        stateChecks,
        structuralHandoff: { frame: handoffFrame, sha256: handoffHash, deterministic: true },
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
