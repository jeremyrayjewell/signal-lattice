import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
const timeline = JSON.parse(await readFile('assets/analysis/prototype-03-timeline.json', 'utf8'));
const SETTINGS = { width: 960, height: 540, fps: 30, frames: 1200 };

const output = path.resolve('renders/prototype-03');
const framesPath = path.join(output, 'frames');
await mkdir(framesPath, { recursive: true });
const data = timeline;
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
function run(binary, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true });
    let stdout = '',
      stderr = '';
    child.stdout.on('data', (d) => {
      stdout += d;
    });
    child.stderr.on('data', (d) => {
      stderr += d;
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve(stdout) : reject(new Error(`${binary}: ${stderr}`)),
    );
  });
}
const baseline = JSON.parse(
  (await readFile(path.join(output, 'baseline-hashes.json'), 'utf8')).replace(/^\uFEFF/, ''),
);
async function verifyBaseline() {
  for (const file of baseline)
    if (hash(await readFile(file.Path)).toUpperCase() !== file.Hash)
      throw new Error(`Baseline modified: ${file.Path}`);
}
await verifyBaseline();
await run('ffmpeg', ['-version']);
const server = await createServer({ server: { host: '127.0.0.1', port: 5173, strictPort: false } });
await server.listen();
const root = server.resolvedUrls.local[0];
const url = `${root}pages/prototype-03.html`;
let browser;
const errors = [];
try {
  const options = {
    headless: true,
    args: ['--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
  };
  if (process.env.CHROME_PATH) options.executablePath = process.env.CHROME_PATH;
  else if (process.platform === 'win32') {
    const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
    try {
      await access(edge);
      options.executablePath = edge;
    } catch {
      /* Default Chromium. */
    }
  }
  browser = await chromium.launch(options);
  const page = await browser.newPage({
    viewport: { width: 1000, height: 700 },
    deviceScaleFactor: 1,
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(url);
  await page.waitForFunction(() => !!window.signalLattice03);
  await page.evaluate(async () => {
    await document.querySelector('audio').play();
  });
  await page.waitForFunction(() => window.signalLattice03.getFrame() > 10);
  await page.evaluate(() => document.querySelector('audio').pause());
  await page.waitForTimeout(150);
  const preview = await page.evaluate(() => ({
    frame: window.signalLattice03.getFrame(),
    audioTime: document.querySelector('audio').currentTime,
  }));
  if (Math.abs(preview.frame / 30 - preview.audioTime) > 1 / 30 + 0.001)
    throw new Error('Preview clock mismatch');
  console.log('Audio-master preview playback and pause verified.');
  await page.goto(`${url}?render=1`);
  await page.waitForFunction(() => !!window.signalLattice03);
  async function capture(f, reactive = true) {
    const result = await page.evaluate(
      ({ f, reactive }) => {
        const state = window.signalLattice03.renderFrame(f, reactive);
        return { state, png: window.signalLattice03.png() };
      },
      { f, reactive },
    );
    if (result.state.trackTime !== data.selection.start + f / 30)
      throw new Error('Track time mismatch');
    return Buffer.from(result.png.split(',')[1], 'base64');
  }
  const reference = hash(await capture(307));
  await capture(1199);
  if (hash(await capture(307)) !== reference) throw new Error('Frame-order determinism failed');
  await page.reload();
  await page.waitForFunction(() => !!window.signalLattice03);
  if (hash(await capture(307)) !== reference) throw new Error('Reload determinism failed');
  const sceneChecks = [];
  for (const f of [120, 440, 740, 1050]) {
    const active = hash(await capture(f));
    const quiet = hash(await capture(f, false));
    const later = hash(await capture(f + 15, false));
    if (quiet === later || quiet === active)
      throw new Error(`Autonomy/music influence failed at ${f}`);
    const state = await page.evaluate((f) => window.signalLattice03.renderFrame(f), f);
    sceneChecks.push({ scene: state.scene, frame: f, autonomous: true, reactive: true });
  }
  const transitionChecks = [];
  for (const clip of timeline.clips.slice(1)) {
    const f = clip.startFrame + Math.floor(clip.transition.frames / 2);
    const before = hash(await capture(f));
    await capture(1199);
    if (hash(await capture(f)) !== before) throw new Error(`Transition nondeterministic at ${f}`);
    const state = await page.evaluate((f) => window.signalLattice03.renderFrame(f), f);
    if (!state.previous || state.mix <= 0 || state.mix >= 1) throw new Error('Missing overlap');
    transitionChecks.push(state);
  }
  console.log(
    'All four scenes retain autonomous motion and music influence; all three transitions are deterministic.',
  );
  const hashes = [];
  for (let f = 0; f < SETTINGS.frames; f++) {
    const png = await capture(f);
    await writeFile(path.join(framesPath, `frame-${String(f).padStart(5, '0')}.png`), png);
    hashes.push(hash(png));
    if ((f + 1) % 75 === 0) console.log(`Rendered ${f + 1}/1200`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  if (new Set(hashes).size !== 1200) throw new Error('Duplicate frames');
  const video = path.join(output, 'signal-lattice-03-40s.mp4');
  console.log('Encoding H.264 with the exact PCM excerpt as AAC 320k.');
  await run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-framerate',
    '30',
    '-start_number',
    '0',
    '-i',
    path.join(framesPath, 'frame-%05d.png'),
    '-i',
    'assets/audio/prototype-03-excerpt.wav',
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-t',
    '40',
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
  const probe = JSON.parse(
    await run('ffprobe', [
      '-v',
      'error',
      '-count_frames',
      '-show_streams',
      '-show_format',
      '-of',
      'json',
      video,
    ]),
  );
  const v = probe.streams.find((s) => s.codec_type === 'video');
  const a = probe.streams.find((s) => s.codec_type === 'audio');
  if (
    !a ||
    v.width !== 960 ||
    v.height !== 540 ||
    v.avg_frame_rate !== '30/1' ||
    Number(v.nb_read_frames) !== 1200 ||
    v.codec_name !== 'h264' ||
    Math.abs(Number(probe.format.duration) - 40) > 0.04 ||
    Math.abs(Number(a.start_time)) > 0.001 ||
    Math.abs(Number(v.start_time)) > 0.001 ||
    Math.abs(Number(a.duration) - 40) > 0.04
  )
    throw new Error('Mux validation failed');
  await run('ffmpeg', ['-v', 'error', '-i', video, '-f', 'null', '-']);
  const samples = [120, 440, 740, 1050];
  const select = samples.map((f) => `eq(n\\,${f})`).join('+');
  await run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-i',
    video,
    '-vf',
    `select=${select},scale=480:270,tile=2x2:padding=12:margin=12:color=0x15292e`,
    '-frames:v',
    '1',
    '-update',
    '1',
    path.join(output, 'contact-sheet.jpg'),
  ]);
  await page.goto(`${root}renders/prototype-03/signal-lattice-03-40s.mp4`);
  await page.waitForSelector('video');
  await page.evaluate(async () => {
    const video = document.querySelector('video');
    video.muted = true;
    await video.play();
  });
  await page.waitForFunction(() => document.querySelector('video').currentTime > 1);
  await verifyBaseline();
  await writeFile(
    path.join(output, 'verification.json'),
    JSON.stringify(
      {
        settings: SETTINGS,
        selection: data.selection,
        source_sha256: data.source_sha256,
        analysisCache: data.analysis,
        sceneChecks,
        transitionChecks,
        timeline,
        browser: browser.version(),
        preview,
        baselineUnchanged: true,
        deterministicFrame: { frame: 307, sha256: reference, reordered: true, reload: true },
        autonomousMotion: true,
        audioInfluence: true,
        uniqueFrames: new Set(hashes).size,
        browserErrors: errors,
        fullDecode: true,
        browserPlayback: true,
        contactSheetFrames: samples,
        probe,
        frameHashes: hashes,
      },
      null,
      2,
    ),
  );
  console.log(`Verified ${video}`);
} finally {
  await browser?.close();
  await server.close();
}
