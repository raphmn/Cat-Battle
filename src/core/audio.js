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
