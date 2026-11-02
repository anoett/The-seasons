"use strict"; // CHANGE 13: catches common mistakes early

/* CHANGE 14: all season data in ONE config object.
   Adding a season = adding one entry here + one block in the CSS. */
const SEASONS = {
  winter: { notes: [261.6, 311.1, 392.0], wave: "sine" }, // calm, minor
  spring: { notes: [392.0, 523.3, 659.3], wave: "triangle" }, // light, rising
  summer: { notes: [523.3, 659.3, 784.0], wave: "square" }, // bright
  autumn: { notes: [329.6, 392.0, 440.0], wave: "sawtooth" }, // warm, mellow
};
const STORAGE_KEY = "season";

const root = document.documentElement; // the <html> element
const radios = document.querySelectorAll('input[name="season"]');
const soundToggle = document.querySelector("#sound-toggle");

/* CHANGE 15: sound is SYNTHESISED with the Web Audio API, so you need no
   audio files. The AudioContext is created lazily on the first click,
   because browsers block audio until the user interacts with the page. */
let audioCtx;
function playSeasonSound(season) {
  if (!soundToggle.checked) return;
  audioCtx = audioCtx || new AudioContext();
  const { notes, wave } = SEASONS[season];
  const now = audioCtx.currentTime;

  notes.forEach((frequency, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = wave;
    osc.frequency.value = frequency;
    // Fade in/out so the sound doesn't "click"; keep it quiet (0.08)
    const start = now + i * 0.12;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.08, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.9);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + 1);
  });
}

/* CHANGE 16: one small function does the real work: it only changes an attribute;
   CSS handles every visual consequence. */
function setSeason(season, { sound = true } = {}) {
  if (!SEASONS[season]) return; // ignore unknown values
  root.dataset.season = season;
  try {
    localStorage.setItem(STORAGE_KEY, season);
  } catch {} // remember choice
  if (sound) playSeasonSound(season);
}

/* CHANGE 17: listen for "change" on each radio (works with mouse, touch AND keyboard) */
radios.forEach((radio) =>
  radio.addEventListener("change", () => setSeason(radio.value)),
);

/* CHANGE 18: restore the saved season on load (silently: no sound) */
let saved = null;
try {
  saved = localStorage.getItem(STORAGE_KEY);
} catch {}
if (saved && SEASONS[saved]) {
  setSeason(saved, { sound: false });
  document.querySelector(`input[value="${saved}"]`).checked = true;
}
