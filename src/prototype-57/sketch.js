import p5 from 'p5';
import { createControls } from '../prototype-02/audio.js';
import { draw } from './scene-bg.js';

const response = await fetch('/assets/analysis/prototype-02.json');
if (!response.ok) throw new Error('Full-track analysis missing');
const data = await response.json(),
  controls = createControls(data);
const START = 128,
  FPS = 30,
  FRAMES = 750;
const offline = new URLSearchParams(location.search).has('render');
const audio = document.querySelector('audio');
new p5((p) => {
  function renderFrame(frame, reactive = true) {
    if (!Number.isInteger(frame) || frame < 0 || frame >= FRAMES)
      throw new Error('Invalid study frame');
    const elapsed = frame / FPS,
      trackTime = START + elapsed;
    const params = draw(p, trackTime, elapsed, controls, reactive);
    document.querySelector('#status').textContent =
      `BG / Scribbled Ledger | ${params.from} to ${params.to} | source ${trackTime.toFixed(3)} s`;
    return { frame, trackTime, params };
  }
  p.setup = () => {
    p.pixelDensity(1);
    p.createCanvas(960, 540).parent('canvas');
    p.frameRate(FPS);
    if (offline) p.noLoop();
    renderFrame(0);
    window.signalLattice57 = { renderFrame, png: () => p.canvas.toDataURL('image/png') };
  };
  p.draw = () => {
    if (!offline) renderFrame(Math.min(FRAMES - 1, Math.floor(audio.currentTime * FPS)));
  };
});
