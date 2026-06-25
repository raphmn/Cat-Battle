// ==========================================
// Scène d'accueil : profil joueur, menu principal, paramètres audio.
// ==========================================

import { navigate } from '../core/sceneManager.js';
import { getPlayerName, setPlayerName, getCats } from '../core/storage.js';
import { setMusicVolume, setSfxVolume } from '../core/audio.js';
import { startRandomBattle } from './levelSelect.js';

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
  // Campagne : si aucun chat, on redirige vers la liste pour en créer un.
  document.getElementById('btn-play').addEventListener('click', () => {
    navigate(getCats().length === 0 ? 'catList' : 'levelSelect');
  });
  // Mode aléatoire : adversaire aux stats totalement aléatoires.
  document.getElementById('btn-random').addEventListener('click', () => {
    if (getCats().length === 0) navigate('catList');
    else startRandomBattle();
  });
  document.getElementById('btn-cat-list').addEventListener('click', () => navigate('catList'));

  // Paramètres audio
  const soundDialog = document.getElementById('sound-dialog');
  document.getElementById('btn-settings').addEventListener('click', () => soundDialog.showModal());
  document.getElementById('btn-close-sound').addEventListener('click', () => soundDialog.close());
  document.getElementById('music-volume').addEventListener('input', (e) => setMusicVolume(e.target.value));
  document.getElementById('sfx-volume').addEventListener('input', (e) => setSfxVolume(e.target.value));

  // Statistiques : historique des combats
  document.getElementById('btn-stats').addEventListener('click', () => navigate('stats'));

  // Fond plein écran aléatoire (jour / coucher de soleil / nuit / hiver)
  const randBg = Math.floor(Math.random() * 4) + 1;
  const lower = document.getElementById('home-bg-lower');
  if (lower) lower.style.backgroundImage = `url('/sprites/bg/bg${randBg}.jpg')`;
}
