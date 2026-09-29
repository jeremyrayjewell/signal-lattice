import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { SETTINGS } from '../src/timing.js';

const output = path.resolve('renders/prototype-01');
const framesPath = path.join(output, 'frames');
await mkdir(framesPath, { recursive: true });
const hash = (data) => createHash('sha256').update(data).digest('hex');
function run(binary, args) {
  const result = spawnSync(binary, args, {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0)
    throw new Error(`${binary}: ${result.error || result.stderr}`);
  return result.stdout;
}

// Verify encoding tools before spending time rendering.
run('ffmpeg', ['-version']);
run('ffprobe', ['-version']);
let browser;
const server = await createServer({ server: { host: '127.0.0.1', port: 5173, strictPort: false } });
await server.listen();
const url = server.resolvedUrls.local[0];
const errors = [];
try {
  const options = { headless: true, args: ['--disable-gpu'] };
  if (process.env.CHROME_PATH) options.executablePath = process.env.CHROME_PATH;
  else if (process.platform === 'win32') {
    const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
    try {
      await access(edge);
      options.executablePath = edge;
    } catch {
      /* Use Playwright Chromium. */
    }
  }
  browser = await chromium.launch(options);
  const page = await browser.newPage({
    viewport: { width: 700, height: 1100 },
    deviceScaleFactor: 1,
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(url);
  await page.waitForFunction(() => window.signalLattice?.getFrame() > 4);
  await page.click('#toggle');
  const paused = await page.evaluate(() => window.signalLattice.getFrame());
  await page.waitForTimeout(150);
  if ((await page.evaluate(() => window.signalLattice.getFrame())) !== paused)
    throw new Error('Preview pause failed');
  await page.click('#toggle');
  await page.waitForFunction((previous) => window.signalLattice.getFrame() > previous, paused);
  console.log('Live preview advances; pause and resume verified.');

  await page.goto(`${url}?render=1`);
  await page.waitForFunction(() => !!window.signalLattice);
  async function capture(frame) {
    const data = await page.evaluate((f) => {
      window.signalLattice.renderFrame(f);
      return window.signalLattice.png();
    }, frame);
    return Buffer.from(data.split(',')[1], 'base64');
  }
  const first137 = hash(await capture(137));
  await capture(299);
  if (hash(await capture(137)) !== first137) throw new Error('Frame order changed the image');
  await page.reload();
  await page.waitForFunction(() => !!window.signalLattice);
  if (hash(await capture(137)) !== first137) throw new Error('Page reload changed the image');
  console.log('Frame 137 is byte-identical after out-of-order rendering and page reload.');
  const hashes = [];
  for (let f = 0; f < SETTINGS.frames; f++) {
    const png = await capture(f);
    await writeFile(path.join(framesPath, `frame-${String(f).padStart(5, '0')}.png`), png);
    hashes.push(hash(png));
    if ((f + 1) % 30 === 0) console.log(`Rendered ${f + 1}/${SETTINGS.frames}`);
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
  if (new Set(hashes).size !== SETTINGS.frames)
    throw new Error('Unexpected duplicate animation frames');
  const video = path.join(output, 'signal-lattice-10s.mp4');
  run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-framerate',
    String(SETTINGS.fps),
    '-start_number',
    '0',
    '-i',
    path.join(framesPath, 'frame-%05d.png'),
    '-frames:v',
    String(SETTINGS.frames),
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    video,
  ]);
  const probe = JSON.parse(
    run('ffprobe', [
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
  const stream = probe.streams.find((s) => s.codec_type === 'video');
  if (
    stream.codec_name !== 'h264' ||
    stream.width !== SETTINGS.width ||
    stream.height !== SETTINGS.height ||
    Number(stream.nb_read_frames) !== 300 ||
    stream.avg_frame_rate !== '30/1' ||
    Math.abs(Number(probe.format.duration) - 10) > 0.04 ||
    probe.streams.some((s) => s.codec_type === 'audio')
  )
    throw new Error('Video validation failed');
  run('ffmpeg', ['-v', 'error', '-i', video, '-f', 'null', '-']);
  const samples = [0, 59, 119, 179, 239, 299];
  const select = samples.map((f) => `eq(n\\,${f})`).join('+');
  run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-i',
    video,
    '-vf',
    `select=${select},scale=270:480,tile=3x2:padding=12:margin=12:color=0x15292e`,
    '-frames:v',
    '1',
    '-update',
    '1',
    path.join(output, 'contact-sheet.jpg'),
  ]);
  // Confirm the encoded artifact plays in the same browser used for preview.
  await page.goto(`${url}renders/prototype-01/signal-lattice-10s.mp4`);
  await page.waitForSelector('video');
  await page.evaluate(async () => {
    const v = document.querySelector('video');
    v.muted = true;
    await v.play();
  });
  await page.waitForFunction(() => document.querySelector('video').currentTime > 0.2);
  await writeFile(
    path.join(output, 'verification.json'),
    JSON.stringify(
      {
        settings: SETTINGS,
        browser: browser.version(),
        preview: 'advance/pause/resume passed',
        deterministic: { frame: 137, sha256: first137, outOfOrder: true, reload: true },
        uniqueFrames: new Set(hashes).size,
        browserErrors: errors,
        decodedAllFrames: true,
        browserPlayback: true,
        contactSheetFrames: samples,
        contactSheetSeconds: samples.map((f) => f / SETTINGS.fps),
        probe,
        frameHashes: hashes,
      },
      null,
      2,
    ),
  );
  console.log(`Verified: ${video}`);
  console.log(`Contact sheet: ${path.join(output, 'contact-sheet.jpg')}`);
} finally {
  await browser?.close();
  await server.close();
}
