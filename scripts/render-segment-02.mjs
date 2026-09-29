// Renders the second 60-second segment of the full-length piece: real track
// time 60-120s, one continuous take, cutting between the 20 lettered scene
// studies built since segment 1 (W-AP) at real transient/onset points —
// none of these appeared in segment 1, per the standing no-repeat rule.
// Transitions ('introduce') are not post-hoc compositing of two finished
// pictures at all: each scene supports drawing a partial, "entering" version
// of itself (see timing.js's introFor and each scene's `intro` parameter) —
// the incoming scene's own elements fly in from scattered positions and
// settle, drawn live on top of the still-live outgoing scene. 'cut' remains
// available for occasional instant on-beat edits. Every subsequent 60s
// segment must avoid repeating visuals used here unless explicitly told
// otherwise.
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';

const FPS = 30,
  START = 60,
  DURATION = 60,
  END = START + DURATION;
const LETTERS = [
  'W',
  'X',
  'Y',
  'Z',
  'AA',
  'AB',
  'AC',
  'AD',
  'AE',
  'AF',
  'AG',
  'AH',
  'AI',
  'AJ',
  'AK',
  'AL',
  'AM',
  'AN',
  'AO',
  'AP',
];
const FRAMES_FOR = { cut: 1, introduce: 54 };

const analysis = JSON.parse(await readFile('assets/analysis/prototype-02.json', 'utf8'));

const idealSpacing = DURATION / LETTERS.length;
const relevant = analysis.events.filter((e) => e.time > START + 1 && e.time < END - 1);
const cutTimes = [START];
for (let i = 1; i < LETTERS.length; i++) {
  const target = START + i * idealSpacing;
  const nearby = relevant.filter((e) => Math.abs(e.time - target) < idealSpacing * 0.55);
  let chosen = nearby.length
    ? nearby.reduce((a, b) => (b.strength > a.strength ? b : a)).time
    : target;
  chosen = Math.max(chosen, cutTimes[cutTimes.length - 1] + 2.2);
  cutTimes.push(chosen);
}

// 'introduce' (elements flying in live) is the default; 'cut' appears
// occasionally for on-beat hard edits.
const cutCount = LETTERS.length - 1;
const base = ['introduce', 'introduce', 'introduce', 'introduce', 'cut'];
const pool = Array.from({ length: cutCount }, (_, i) => base[i % base.length]);
for (let i = pool.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [pool[i], pool[j]] = [pool[j], pool[i]];
}

const clips = cutTimes.map((time, i) => {
  const type = i === 0 ? null : pool[(i - 1) % pool.length];
  return {
    scene: LETTERS[i],
    startFrame: Math.round((time - START) * FPS),
    stateFrom: i === 0 ? 'CALM' : 'ACTIVE',
    stateTo: i === 0 ? 'ACTIVE' : 'EXTREME',
    transition: type ? { type, frames: FRAMES_FOR[type] } : null,
    transitionSeed: 5000 + i * 733,
  };
});

const timeline = {
  version: 1,
  width: 960,
  height: 540,
  fps: FPS,
  frames: DURATION * FPS,
  selection: { start: START, end: END, duration: DURATION },
  analysis: '/assets/analysis/prototype-02.json',
  source: analysis.source,
  source_sha256: analysis.source_sha256,
  clips,
};
await writeFile('assets/analysis/scene-reel-timeline.json', JSON.stringify(timeline, null, 2));
console.log('Segment 2 cut schedule (real track time):');
clips.forEach((c, i) =>
  console.log(
    `  ${c.scene} @ ${(START + c.startFrame / FPS).toFixed(2)}s (frame ${c.startFrame})${c.transition ? ' ' + c.transition.type : ''}`,
  ),
);

const output = path.resolve('renders/segment-02'),
  frames = path.join(output, 'frames');
await mkdir(frames, { recursive: true });

// Fresh audio pulled directly from the original track for 60-120s.
const SOURCE_AUDIO = process.env.SIGNAL_LATTICE_SOURCE_AUDIO;
if (!SOURCE_AUDIO)
  throw new Error(
    'Set the SIGNAL_LATTICE_SOURCE_AUDIO environment variable to the path of your own source track (see README).',
  );
const audioOut = 'assets/audio/segment-02-excerpt.wav';
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
await run('ffmpeg', [
  '-y',
  '-v',
  'error',
  '-i',
  SOURCE_AUDIO,
  '-ss',
  String(START),
  '-t',
  String(DURATION),
  audioOut,
]);

const hash = (b) => createHash('sha256').update(b).digest('hex');
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
  // scene-reel.html points its <audio> tag at the demo excerpt; that element
  // is never used for rendering (frames are captured directly from canvas),
  // only real audio data drives controls.at(), which reads assets/analysis
  // JSON directly — so no page-level change is needed for the new timeline.
  await page.goto(`${server.resolvedUrls.local[0]}scene-reel.html?render=1`);
  await page.waitForFunction(() => !!window.signalLatticeReel);
  async function capture(frame) {
    const png = await page.evaluate((f) => {
      window.signalLatticeReel.renderFrame(f);
      return window.signalLatticeReel.png();
    }, frame);
    return Buffer.from(png.split(',')[1], 'base64');
  }
  const checkFrame = Math.round(timeline.frames * 0.6);
  const reference = hash(await capture(checkFrame));
  await capture(10);
  if (hash(await capture(checkFrame)) !== reference)
    throw new Error('Segment 2 rendering is stateful (out-of-order replay mismatch)');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Deterministic out-of-order replay check passed.');
  for (let f = 0; f < timeline.frames; f++) {
    await writeFile(path.join(frames, `frame-${String(f).padStart(5, '0')}.png`), await capture(f));
    if ((f + 1) % 150 === 0) console.log(`Rendered ${f + 1}/${timeline.frames}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  const video = path.join(output, 'signal-lattice-segment-02-60s.mp4');
  console.log('Encoding segment 2.');
  await run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-framerate',
    String(FPS),
    '-start_number',
    '0',
    '-i',
    path.join(frames, 'frame-%05d.png'),
    '-i',
    audioOut,
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-t',
    String(DURATION),
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
  await writeFile(
    path.join(output, 'render-report.json'),
    JSON.stringify(
      {
        timeline,
        browser: browser.version(),
        browserErrors: errors,
        renderedFrames: timeline.frames,
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
