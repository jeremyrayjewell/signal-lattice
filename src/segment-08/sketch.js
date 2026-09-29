import p5 from 'p5';
import { createControls } from '../prototype-02/audio.js';
import { createManager } from './manager.js';

async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Missing ${url}`);
  return r.json();
}
const timeline = await get('/assets/analysis/segment-08-timeline.json');
const data = await get(timeline.analysis),
  controls = createControls(data);
const offline = new URLSearchParams(location.search).has('render');
const audio = document.querySelector('audio');
new p5((p) => {
  let manager;
  function renderFrame(f, reactive = true) {
    if (!Number.isInteger(f) || f < 0 || f >= timeline.frames)
      throw new Error('Invalid reel frame');
    const state = manager.render(f, reactive);
    document.querySelector('#status').textContent =
      `${state.pair} | ${state.trackTime.toFixed(3)} s`;
    return state;
  }
  p.setup = () => {
    p.pixelDensity(1);
    p.createCanvas(timeline.width, timeline.height).parent('canvas');
    p.frameRate(timeline.fps);
    manager = createManager(p, timeline, controls);
    if (offline) p.noLoop();
    renderFrame(0);
    window.signalLatticeReel = {
      timeline,
      renderFrame,
      png: () => p.canvas.toDataURL('image/png'),
    };
  };
  p.draw = () => {
    if (!offline)
      renderFrame(Math.min(timeline.frames - 1, Math.floor(audio.currentTime * timeline.fps)));
  };
});
