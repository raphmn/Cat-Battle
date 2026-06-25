// ==========================================
// Point d'entrée de l'application (chargé par index.html).
// Rôle : importer les styles + la police, enregistrer et initialiser
// toutes les scènes, gérer l'écran de démarrage, le son global sur les
// boutons, et enregistrer le Service Worker (PWA / hors-ligne).
// ==========================================

import '@fontsource/press-start-2p'; // police hébergée localement (pas de dépendance réseau)
import './style.css';
import './battle.css';

import { initAudio, startBgm, playSfx } from './core/audio.js';
import { register, navigate } from './core/sceneManager.js';
import { initHome } from './scenes/home.js';
import { initCatList } from './scenes/catList.js';
import { initLevelSelect } from './scenes/levelSelect.js';
import { initBattle } from './scenes/battle.js';
import { initStats } from './scenes/stats.js';

// ==========================================
// Enregistrement des scènes définies dans index.html
// (les scènes Niveaux et Combat s'enregistrent elles-mêmes)
// ==========================================
register('home', document.getElementById('ui-layer'), 'flex');
register('catList', document.getElementById('scene-cat-list'), 'flex');
register('adopt', document.getElementById('scene-adopt'), 'flex');

// Initialisation des modules
initAudio();
initHome();
initCatList();
initLevelSelect();
initBattle();
initStats();

// ==========================================
// Écran de chargement & démarrage
// ==========================================
const loadingScreen = document.getElementById('loading-screen');
const btnStart = document.getElementById('btn-start');
let audioStarted = false;

btnStart.addEventListener('click', async () => {
  if (!audioStarted) {
    startBgm(document.getElementById('music-volume').value);
    audioStarted = true;
  }

  // Plein écran pour l'immersion mobile
  try {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch (err) {
    console.log('Fullscreen request failed', err);
  }

  loadingScreen.style.opacity = '0';
  setTimeout(() => {
    loadingScreen.style.display = 'none';
    navigate('home');
  }, 500);
});

// Son sur tous les boutons de l'UI
document.body.addEventListener('click', (e) => {
  if (e.target.closest('button') || e.target.closest('#player-profile')) {
    playSfx();
  }
});

// Affiche le bouton "Click to Start" une fois "chargé"
setTimeout(() => {
  document.getElementById('loading-text').style.display = 'none';
  btnStart.style.display = 'block';
}, 500);

// ==========================================
// PWA : Service Worker
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => console.log('ServiceWorker scope:', registration.scope),
      (err) => console.log('ServiceWorker registration failed:', err)
    );
  });
}
