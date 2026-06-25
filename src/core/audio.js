// ==========================================
// Gestion centralisée de l'audio : musique de fond (bgm) + effets (sfx).
// ==========================================

let bgm = null;
let sfx = null;
let sfxVol = 0.5;

const MENU_TRACK = '/audio/ost1.mp3';
// Pool de musiques de combat : une est tirée au hasard à chaque combat.
const BATTLE_TRACKS = [
  '/audio/ost2.mp3',
  '/audio/ost5.mp3',
  '/audio/ost6.mp3',
  '/audio/ost7.mp3',
  '/audio/ost8.mp3',
  '/audio/ost9.mp3',
];

let lastBattle = null;
// Tire une piste de combat différente de la précédente (si possible).
function pickBattleTrack() {
  if (BATTLE_TRACKS.length <= 1) return BATTLE_TRACKS[0];
  let t;
  do {
    t = BATTLE_TRACKS[Math.floor(Math.random() * BATTLE_TRACKS.length)];
  } while (t === lastBattle);
  lastBattle = t;
  return t;
}

let clickBuffer = null;
let clawBuffer = null;
let damageBuffer = null;
let criticalBuffer = null;
let failBuffer = null;
let velocityBuffer = null;
let bgmGain = null;
let bgmSource = null;
let critFallback = new Audio('/audio/combat/UI_critical.mp3');

function playBuffer(buffer) {
  const c = audioCtx();
  if (!c || !buffer) return;
  const source = c.createBufferSource();
  source.buffer = buffer;
  const gain = c.createGain();
  gain.gain.value = sfxVol;
  source.connect(gain);
  gain.connect(c.destination);
  source.start(0);
}

async function loadSound(url) {
  try {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    const c = audioCtx();
    return await new Promise((resolve, reject) => {
      const p = c.decodeAudioData(arr, resolve, reject);
      if (p) p.then(resolve).catch(reject);
    });
  } catch (e) {
    console.warn('Failed to load', url, e);
    return null;
  }
}

export async function initAudio() {
  bgm = document.getElementById('bgm');
  sfx = new Audio('/audio/menu_click.mp3');
  sfx.volume = sfxVol;
  
  const c = audioCtx();
  if (c && !bgmSource && bgm) {
    try {
      bgmSource = c.createMediaElementSource(bgm);
      bgmGain = c.createGain();
      bgmGain.gain.value = bgm.volume;
      bgmSource.connect(bgmGain);
      bgmGain.connect(c.destination);
    } catch (e) {
      console.warn('Could not route bgm to WebAudio:', e);
    }
  }

  clickBuffer = await loadSound('/audio/menu_click.mp3');
  clawBuffer = await loadSound('/audio/combat/claw.wav');
  damageBuffer = await loadSound('/audio/combat/damage.mp3');
  criticalBuffer = await loadSound('/audio/combat/UI_critical.mp3');
  failBuffer = await loadSound('/audio/combat/fail.mp3');
  velocityBuffer = await loadSound('/audio/combat/velocity.mp3');
}

export function startBgm(volume) {
  if (!bgm) return;
  if (volume != null) {
    const vol = parseFloat(volume);
    bgm.volume = vol;
    if (bgmGain) bgmGain.gain.setValueAtTime(vol, audioCtx().currentTime);
  }
  bgm.play().catch((e) => console.warn('Audio play failed:', e));
}

export function setMusicVolume(v) {
  const vol = parseFloat(v);
  if (bgm) bgm.volume = vol;
  if (bgmGain) bgmGain.gain.setValueAtTime(vol, audioCtx().currentTime);
}

export function setSfxVolume(v) {
  sfxVol = parseFloat(v);
  if (sfx) sfx.volume = sfxVol;
}

export function playSfx() {
  if (clickBuffer) {
    playBuffer(clickBuffer);
  } else {
    if (!sfx) return;
    sfx.currentTime = 0;
    sfx.play().catch((err) => console.warn('SFX play failed:', err));
  }
}

// --- Effets de combat synthétisés (WebAudio, pas d'asset requis) ---
let actx = null;
function audioCtx() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) actx = new AC();
  }
  if (actx && actx.state === 'suspended') actx.resume().catch(() => {});
  return actx;
}

function playTone(freq, dur, type = 'square', slideTo = null) {
  const c = audioCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) osc.frequency.linearRampToValueAtTime(slideTo, c.currentTime + dur);
    const peak = Math.max(0.0001, sfxVol * 0.3);
    gain.gain.setValueAtTime(0.0001, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(peak, c.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  } catch (e) {
    /* ignore */
  }
}

export function sfxHit() {
  if (damageBuffer) playBuffer(damageBuffer);
  else playTone(180, 0.12, 'square');
}
export function sfxClaw() {
  if (clawBuffer) playBuffer(clawBuffer);
}
export function sfxCritical() {
  if (criticalBuffer) {
    playBuffer(criticalBuffer);
  } else {
    critFallback.currentTime = 0;
    critFallback.volume = sfxVol;
    critFallback.play().catch(e => console.warn('critFallback err', e));
  }
}
export function sfxFail() {
  if (failBuffer) playBuffer(failBuffer);
}
export function sfxVelocity() {
  if (velocityBuffer) playBuffer(velocityBuffer);
}
export function sfxSpecial() {
  playTone(320, 0.2, 'sawtooth', 540);
}
export function sfxFaint() {
  playTone(300, 0.5, 'sine', 70);
}

// Change de piste en gardant le volume courant.
// 'menu' : piste unique. 'battle' : une piste tirée au hasard du pool
// (différente de la précédente) à chaque appel.
export function playTrack(key) {
  if (!bgm) return;
  let src;
  if (key === 'menu') src = MENU_TRACK;
  else if (key === 'battle') src = pickBattleTrack();
  else return;

  const source = bgm.querySelector('source');
  // Pour le menu on évite de relancer la même piste ; pour un combat on
  // recharge toujours afin de jouer la nouvelle musique tirée au sort.
  if (key === 'menu' && source && source.getAttribute('src') === src) return;

  const wasPlaying = !bgm.paused;
  if (source) source.setAttribute('src', src);
  bgm.load();
  if (wasPlaying) bgm.play().catch(() => {});
}
