// ==========================================
// Scène d'accueil : profil joueur, menu principal, paramètres audio.
// ==========================================

import { navigate } from '../core/sceneManager.js';
import { getPlayerName, setPlayerName } from '../core/storage.js';
import { setMusicVolume, setSfxVolume } from '../core/audio.js';

export function initHome() {
  const nameEl = document.getElementById('player-name');
  const profile = document.getElementById('player-profile');
  nameEl.textContent = getPlayerName();

  profile.addEventListener('click', () => {
    const n = prompt('Entrez votre nouveau nom de dresseur :', getPlayerName());
    if (n !== null && n.trim() !== '') {
      setPlayerName(n.trim());
      nameEl.textContent = n.trim();
    }
  });

  // Menu principal
  document.getElementById('btn-play').addEventListener('click', () => navigate('levelSelect'));
  document.getElementById('btn-cat-list').addEventListener('click', () => navigate('catList'));

  // Paramètres audio
  const soundDialog = document.getElementById('sound-dialog');
  document.getElementById('btn-settings').addEventListener('click', () => soundDialog.showModal());
  document.getElementById('btn-close-sound').addEventListener('click', () => soundDialog.close());
  document.getElementById('music-volume').addEventListener('input', (e) => setMusicVolume(e.target.value));
  document.getElementById('sfx-volume').addEventListener('input', (e) => setSfxVolume(e.target.value));

  // Statistiques : historique des combats
  document.getElementById('btn-stats').addEventListener('click', () => navigate('stats'));

  // Fond aléatoire pour la moitié basse de l'écran d'accueil
  const randBg = Math.floor(Math.random() * 4) + 1;
  const lower = document.getElementById('home-bg-lower');
  if (lower) lower.style.backgroundImage = `url('/sprites/bg/bg${randBg}.png')`;
}
