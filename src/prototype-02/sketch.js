import p5 from 'p5';
import { createControls } from './audio.js';
import { drawSystem, SETTINGS } from './visual-system.js';

const response = await fetch('/assets/analysis/prototype-02.json');
if (!response.ok) throw new Error('Run full-track analysis before opening Prototype-02.');
const data = await response.json();
const controls = createControls(data);
const offline = new URLSearchParams(location.search).has('render');
const audio = document.querySelector('#track');
let frame = 0;
new p5((p) => {
  function renderFrame(f, reactive = true) {
    if (!Number.isSafeInteger(f) || f < 0 || f >= SETTINGS.frames)
      throw new Error('Invalid excerpt frame');
    frame = f;
    const trackTime = data.selection.start + frame / SETTINGS.fps;
    drawSystem(p, trackTime, controls, reactive);
    document.querySelector('#status').textContent =
      `Source ${trackTime.toFixed(3)} s · frame ${frame} / 749`;
    return { frame, trackTime };
  }
  p.setup = () => {
    p.pixelDensity(1);
    p.createCanvas(960, 540).parent('canvas');
    p.frameRate(30);
    if (offline) p.noLoop();
    renderFrame(0);
    window.signalLattice02 = {
      settings: SETTINGS,
      selection: data.selection,
      renderFrame,
      getFrame: () => frame,
      png: () => p.canvas.toDataURL('image/png'),
    };
  };
  p.draw = () => {
    if (!offline) renderFrame(Math.min(749, Math.floor(audio.currentTime * 30)));
  };
});
