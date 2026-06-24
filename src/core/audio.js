// ==========================================
// Gestion centralisée de l'audio : musique de fond (bgm) + effets (sfx).
// ==========================================

let bgm = null;
let sfx = null;
let sfxVol = 0.5;

const TRACKS = {
  menu: '/audio/ost1.mp3',
  battle: '/audio/ost2.mp3',
};

export function initAudio() {
  bgm = document.getElementById('bgm');
  sfx = new Audio('/audio/menu_click.mp3');
  sfx.volume = sfxVol;
}

export function startBgm(volume) {
  if (!bgm) return;
  if (volume != null) bgm.volume = parseFloat(volume);
  bgm.play().catch((e) => console.warn('Audio play failed:', e));
}

export function setMusicVolume(v) {
  if (bgm) bgm.volume = parseFloat(v);
}

export function setSfxVolume(v) {
  sfxVol = parseFloat(v);
  if (sfx) sfx.volume = sfxVol;
}

export function playSfx() {
  if (!sfx) return;
  sfx.currentTime = 0;
  sfx.play().catch((err) => console.warn('SFX play failed:', err));
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
  playTone(180, 0.12, 'square');
}
export function sfxSpecial() {
  playTone(320, 0.2, 'sawtooth', 540);
}
export function sfxFaint() {
  playTone(300, 0.5, 'sine', 70);
}

// Change de piste (menu <-> combat) en gardant le volume courant.
export function playTrack(key) {
  if (!bgm) return;
  const src = TRACKS[key];
  if (!src) return;
  const source = bgm.querySelector('source');
  if (source && source.getAttribute('src') === src) return;
  const wasPlaying = !bgm.paused;
  if (source) source.setAttribute('src', src);
  bgm.load();
  if (wasPlaying) bgm.play().catch(() => {});
}
