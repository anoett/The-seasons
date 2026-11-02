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

/* NEW CHANGE 23: only the DIFFERENCES between seasons are described here.
   Shared settings live once in buildParticlesConfig() below (DRY principle). */
const PARTICLES = {
  winter: {
    colors: ["#ffffff", "#dbeeff"],
    shape: "circle",
    count: 120,
    size: 4,
    speed: 2,
    direction: "bottom",
    opacity: 0.8,
    twinkle: false,
  },
  spring: {
    colors: ["#ff9ec4", "#ffffff", "#ffc4dc"],
    shape: "circle",
    count: 60,
    size: 6,
    speed: 1.5,
    direction: "bottom",
    opacity: 0.85,
    twinkle: false,
  },
  summer: {
    colors: ["#fff7c2", "#ffffff"],
    shape: "circle",
    count: 50,
    size: 5,
    speed: 1,
    direction: "top",
    opacity: 0.8,
    twinkle: true,
  },
  autumn: {
    colors: ["#e8772e", "#f2a65a", "#c0392b"],
    shape: "polygon",
    count: 45,
    size: 9,
    speed: 2,
    direction: "bottom-left",
    opacity: 0.9,
    twinkle: false,
  },
};

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

/* NEW CHANGE 24: builds the full particles.js config from a season's short description. */
function buildParticlesConfig(p) {
  // Fewer particles on small screens: better performance and less clutter
  const count = window.innerWidth < 768 ? Math.round(p.count / 2) : p.count;
  return {
    particles: {
      number: { value: count, density: { enable: true, value_area: 800 } },
      color: { value: p.colors },
      shape: { type: p.shape, polygon: { nb_sides: 5 } },
      opacity: {
        value: p.opacity,
        random: true,
        anim: { enable: p.twinkle, speed: 1, opacity_min: 0.1, sync: false },
      },
      size: { value: p.size, random: true },
      line_linked: { enable: false },
      move: {
        enable: true,
        speed: p.speed,
        direction: p.direction,
        random: true,
        straight: false,
        out_mode: "out",
      },
    },
    interactivity: {
      events: {
        onhover: { enable: false },
        onclick: { enable: false },
        resize: true,
      },
    },
    retina_detect: true,
  };
}

/* NEW CHANGE 25: destroy the previous animation, then start the new one.
   Without destroying, each click would stack another canvas on top. */
function renderParticles(season) {
  if (typeof particlesJS === "undefined") return; // CDN blocked/offline: page still works
  if (window.pJSDom && window.pJSDom.length) {
    window.pJSDom[0].pJS.fn.vendors.destroypJS();
    window.pJSDom = [];
  }
  // Respect "reduce motion": show a calm page with no animation
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  particlesJS("particles", buildParticlesConfig(PARTICLES[season]));
}

/* CHANGE 16: one small function does the real work: it only changes an attribute;
   CSS handles every visual consequence. */
function setSeason(season, { sound = true } = {}) {
  if (!SEASONS[season]) return; // ignore unknown values
  root.dataset.season = season;
  try {
    localStorage.setItem(STORAGE_KEY, season);
  } catch {} // remember choice
  renderParticles(season); // NEW CHANGE 26
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
} else {
  renderParticles(root.dataset.season); // NEW CHANGE 27: first visit: start winter particles
}
