import p5 from 'p5';
import { createControls } from '../prototype-02/audio.js';
import { createManager } from './scene-manager.js';

async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Missing ${url}`);
  return r.json();
}
const timeline = await get('/assets/analysis/prototype-03-timeline.json');
const data = await get(timeline.analysis);
const controls = createControls(data);
const audio = document.querySelector('audio');
const offline = new URLSearchParams(location.search).has('render');
let frame = 0;
new p5((p) => {
  let manager;
  function renderFrame(f, reactive = true) {
    const state = manager.render(f, reactive);
    frame = f;
    document.querySelector('#status').textContent =
      `${state.scene}${state.previous ? ` / ${state.previous}` : ''} · source ${state.trackTime.toFixed(3)} s`;
    return state;
  }
  p.setup = () => {
    p.pixelDensity(1);
    p.createCanvas(timeline.width, timeline.height).parent('canvas');
    p.frameRate(timeline.fps);
    manager = createManager(p, timeline, controls);
    if (offline) p.noLoop();
    renderFrame(0);
    window.signalLattice03 = {
      timeline,
      renderFrame,
      getFrame: () => frame,
      png: () => p.canvas.toDataURL('image/png'),
    };
  };
  p.draw = () => {
    if (!offline)
      renderFrame(Math.min(timeline.frames - 1, Math.floor(audio.currentTime * timeline.fps)));
  };
});
