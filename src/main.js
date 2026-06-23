import './style.css'

// ==========================================
// 1. (feat) Gestion du Profil Joueur (localStorage)
// ==========================================
const playerNameEl = document.getElementById('player-name');
const playerProfileEl = document.getElementById('player-profile');

// Charger le nom depuis le localStorage ou utiliser une valeur par défaut
let currentName = localStorage.getItem('catbattle_player_name') || 'Dresseur';
playerNameEl.textContent = currentName;

playerProfileEl.addEventListener('click', () => {
  const newName = prompt('Entrez votre nouveau nom de dresseur :', currentName);
  if (newName !== null && newName.trim() !== '') {
    currentName = newName.trim();
    playerNameEl.textContent = currentName;
    localStorage.setItem('catbattle_player_name', currentName);
  }
});

// ==========================================
// 2. (impl) Boutons & Dialog "À implémenter"
// ==========================================
const dialog = document.getElementById('impl-dialog');
const btnCloseDialog = document.getElementById('btn-close-dialog');

const buttonsToImplement = [
  'btn-play',
  document.getElementById('btn-adopt'),
  ...document.querySelectorAll('.drawer-btn:not(#btn-settings):not(#btn-cat-list)')
];

buttonsToImplement.forEach(idOrEl => {
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if (el) {
    el.addEventListener('click', () => {
      dialog.showModal();
    });
  }
});

btnCloseDialog.addEventListener('click', () => {
  dialog.close();
});

// ==========================================
// 2.5 Scene Liste Chats
// ==========================================
const sceneCatList = document.getElementById('scene-cat-list');
const btnCatList = document.getElementById('btn-cat-list');
const btnBackCatList = document.getElementById('btn-back-cat-list');
const catListEmptyMsg = document.getElementById('cat-list-empty-msg');
const catListItems = document.getElementById('cat-list-items');

btnCatList.addEventListener('click', () => {
  uiLayer.style.display = 'none';
  sceneCatList.style.display = 'flex';
  
  // Check LocalStorage
  const cats = JSON.parse(localStorage.getItem('cat_list') || '[]');
  if (cats.length === 0) {
    catListEmptyMsg.style.display = 'block';
    catListItems.style.display = 'none';
  } else {
    catListEmptyMsg.style.display = 'none';
    catListItems.style.display = 'block';
    // Todo plus tard: render cats
  }
});

btnBackCatList.addEventListener('click', () => {
  sceneCatList.style.display = 'none';
  uiLayer.style.display = 'flex';
});

// ==========================================
// PWA: Enregistrement du Service Worker
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, (err) => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// ==========================================
// 3. Audio Auto-play & Sound Menu
// ==========================================
const audioBgm = document.getElementById('bgm');
const btnSettings = document.getElementById('btn-settings');
const soundDialog = document.getElementById('sound-dialog');
const btnCloseSound = document.getElementById('btn-close-sound');
const musicVolume = document.getElementById('music-volume');
const sfxVolume = document.getElementById('sfx-volume'); // Placeholder pour plus tard

let audioStarted = false;

// Loading Screen & Start Game
const loadingScreen = document.getElementById('loading-screen');
const btnStart = document.getElementById('btn-start');
const uiLayer = document.getElementById('ui-layer');

btnStart.addEventListener('click', async () => {
  if (!audioStarted) {
    audioBgm.volume = musicVolume.value;
    audioBgm.play().catch(e => console.warn("Audio play failed:", e));
    audioStarted = true;
  }
  
  // Demande le mode plein écran pour une meilleure immersion sur mobile
  try {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch (err) {
    console.log("Fullscreen request failed", err);
  }

  // Transition
  loadingScreen.style.opacity = '0';
  setTimeout(() => {
    loadingScreen.style.display = 'none';
    uiLayer.style.display = 'flex'; // Afficher l'UI Desktop/Mobile
  }, 500); // Temps de la transition CSS
});

// Sound Menu
btnSettings.addEventListener('click', () => {
  soundDialog.showModal();
});

btnCloseSound.addEventListener('click', () => {
  soundDialog.close();
});

// SFX click
const sfxClick = new Audio('/audio/menu_click.mp3');

// Update Volume
musicVolume.addEventListener('input', (e) => {
  audioBgm.volume = parseFloat(e.target.value);
});
sfxVolume.addEventListener('input', (e) => {
  sfxClick.volume = parseFloat(e.target.value);
});
// Set initial SFX volume
sfxClick.volume = parseFloat(sfxVolume.value);

// Global click listener for UI sounds
document.body.addEventListener('click', (e) => {
  if (e.target.closest('button') || e.target.closest('#player-profile')) {
    sfxClick.currentTime = 0;
    sfxClick.play().catch(err => console.warn("SFX play failed:", err));
  }
});

// Simulation du chargement initial (plus de WebGL à attendre)
setTimeout(() => {
  document.getElementById('loading-text').style.display = 'none';
  document.getElementById('btn-start').style.display = 'block';
}, 500);


