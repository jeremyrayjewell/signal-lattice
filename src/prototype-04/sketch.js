import p5 from 'p5';
import { createControls } from '../prototype-02/audio.js';
import { createManager } from './scene-manager.js';

async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Missing ${url}`);
  return r.json();
}
const timeline = await get('/assets/analysis/prototype-04-timeline.json');
const data = await get(timeline.analysis),
  controls = createControls(data);
const audio = document.querySelector('audio');
const offline = new URLSearchParams(location.search).has('render');
let frame = 0;
new p5((p) => {
  let manager;
  function renderFrame(f, reactive = true) {
    const state = manager.render(f, reactive);
    frame = f;
    const clip = timeline.clips[state.index];
    document.querySelector('#status').textContent =
      `${state.scene} · ${clip.stateFrom} → ${clip.stateTo} · ${state.trackTime.toFixed(3)} s`;
    return state;
  }
  p.setup = () => {
    p.pixelDensity(1);
    p.createCanvas(timeline.width, timeline.height).parent('canvas');
    p.frameRate(30);
    manager = createManager(p, timeline, controls);
    if (offline) p.noLoop();
    renderFrame(0);
    window.signalLattice04 = {
      timeline,
      renderFrame,
      renderFamily: (...args) => manager.renderFamily(...args),
      png: () => p.canvas.toDataURL('image/png'),
    };
  };
  p.draw = () => {
    if (!offline) renderFrame(Math.min(timeline.frames - 1, Math.floor(audio.currentTime * 30)));
  };
});
