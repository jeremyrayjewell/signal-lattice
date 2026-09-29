import p5 from 'p5';
import { SETTINGS, stateAt } from './timing.js';
import { drawSystem } from './visual-system.js';

const offline = new URLSearchParams(location.search).has('render');
let frame = 0;
let playing = !offline;

new p5((p) => {
  function renderFrame(nextFrame) {
    const state = stateAt(nextFrame);
    drawSystem(p, state);
    frame = nextFrame;
    document.querySelector('#position').textContent = `FRAME ${String(frame).padStart(5, '0')}`;
    return state;
  }
  p.setup = () => {
    p.pixelDensity(1);
    p.createCanvas(SETTINGS.width, SETTINGS.height).parent('canvas');
    p.frameRate(SETTINGS.fps);
    if (offline) p.noLoop();
    renderFrame(0);
    window.signalLattice = {
      settings: SETTINGS,
      renderFrame,
      getFrame: () => frame,
      png: () => p.canvas.toDataURL('image/png'),
    };
    document.querySelector('#toggle').textContent = playing ? 'Pause' : 'Play';
    document.querySelector('#toggle').onclick = () => {
      playing = !playing;
      document.querySelector('#toggle').textContent = playing ? 'Pause' : 'Play';
      if (playing) p.loop();
      else p.noLoop();
    };
  };
  p.draw = () => {
    if (playing) renderFrame(frame + 1);
  };
});
