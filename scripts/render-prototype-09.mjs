import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';

const timeline = JSON.parse(await readFile('assets/analysis/prototype-09-timeline.json', 'utf8'));
const output = path.resolve('renders/prototype-09'),
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
  await page.goto(`${server.resolvedUrls.local[0]}pages/prototype-09.html?render=1`);
  await page.waitForFunction(() => !!window.signalLattice09);
  const stateChecks = [];
  // New functionality only: each family supports visibly distinct interpolated regimes.
  for (const scene of 'ABCDEFGHIJK') {
    const hashes = [];
    for (const state of ['CALM', 'ACTIVE', 'EXTREME']) {
      const png = await page.evaluate(
        ({ scene, state }) => {
          window.signalLattice09.renderFamily(scene, 600, state);
          return window.signalLattice09.png();
        },
        { scene, state },
      );
      hashes.push(hash(png));
    }
    if (new Set(hashes).size !== 3) throw new Error(`State regimes identical for ${scene}`);
    const samples = [];
    for (const [f, reactive] of [
      [600, true],
      [600, false],
      [615, false],
    ]) {
      samples.push(
        hash(
          await page.evaluate(
            ({ scene, f, reactive }) => {
              window.signalLattice09.renderFamily(scene, f, 'ACTIVE', reactive);
              return window.signalLattice09.png();
            },
            { scene, f, reactive },
          ),
        ),
      );
    }
    if (samples[0] === samples[1] || samples[1] === samples[2])
      throw new Error(`Music or autonomous motion missing for ${scene}`);
    stateChecks.push({ scene, distinctStates: true, audioResponsive: true, autonomous: true });
  }
  async function capture(frame) {
    const png = await page.evaluate((f) => {
      window.signalLattice09.renderFrame(f);
      return window.signalLattice09.png();
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
    'All eleven families have distinct calm/active/extreme states; geometry handoff is deterministic.',
  );
  await mkdir(path.join(output, 'preflight'), { recursive: true });
  for (const sample of timeline.representatives)
    await writeFile(
      path.join(output, 'preflight', `${sample.scene}-${sample.frame}.png`),
      await capture(sample.frame),
    );
  if (process.argv.includes('--repair-structural')) {
    for (
      let f = structural.startFrame;
      f < structural.startFrame + structural.transition.frames;
      f++
    ) {
      await writeFile(
        path.join(frames, `frame-${String(f).padStart(5, '0')}.png`),
        await capture(f),
      );
    }
    console.log('Replaced all 90 structural-transition frames.');
  }
  let resume = 0;
  if (process.argv.includes('--resume')) {
    while (resume < timeline.frames) {
      try {
        await access(path.join(frames, `frame-${String(resume).padStart(5, '0')}.png`));
        resume++;
      } catch {
        break;
      }
    }
    if (resume) {
      const previous = await readFile(
        path.join(frames, `frame-${String(resume - 1).padStart(5, '0')}.png`),
      );
      if (hash(previous) !== hash(await capture(resume - 1)))
        throw new Error('Resume frame does not match current renderer');
    }
    console.log(`Verified resume boundary; reusing ${resume} deterministic frames.`);
  }
  for (let f = resume; f < timeline.frames; f++) {
    await writeFile(path.join(frames, `frame-${String(f).padStart(5, '0')}.png`), await capture(f));
    if ((f + 1) % 150 === 0) console.log(`Rendered ${f + 1}/${timeline.frames}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  const video = path.join(output, 'signal-lattice-09-90s.mp4');
  console.log('Encoding the 90-second scene-bank study.');
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
    'assets/audio/prototype-08-excerpt.wav',
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-t',
    '90',
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
  await run('python', ['scripts/contact-prototype-09.py']);
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
