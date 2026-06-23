import './style.css'
import { Cat, DomesticCat, WildCat } from './entities/Cat.js';

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
// 2.5 Scene Liste Chats & Adoption
// ==========================================
const sceneCatList = document.getElementById('scene-cat-list');
const btnCatList = document.getElementById('btn-cat-list');
const btnBackCatList = document.getElementById('btn-back-cat-list');
const catListEmptyMsg = document.getElementById('cat-list-empty-msg');
const catListItems = document.getElementById('cat-list-items');

const sceneAdopt = document.getElementById('scene-adopt');
const btnAdopt = document.getElementById('btn-adopt');
const btnCancelAdopt = document.getElementById('btn-cancel-adopt');
const formAdopt = document.getElementById('form-adopt');

// Affiche la liste des chats
btnCatList.addEventListener('click', () => {
  uiLayer.style.display = 'none';
  sceneCatList.style.display = 'flex';
  renderCatList();
});

btnBackCatList.addEventListener('click', () => {
  sceneCatList.style.display = 'none';
  uiLayer.style.display = 'flex';
});

// Affiche le formulaire d'adoption
btnAdopt.addEventListener('click', () => {
  const cats = JSON.parse(localStorage.getItem('cat_list') || '[]');
  if (cats.length >= 5) {
    alert("Vous ne pouvez pas avoir plus de 5 chats !");
    return;
  }
  sceneCatList.style.display = 'none';
  sceneAdopt.style.display = 'flex';
});

btnCancelAdopt.addEventListener('click', () => {
  sceneAdopt.style.display = 'none';
  sceneCatList.style.display = 'flex';
  formAdopt.reset();
});

// Soumission de l'adoption
formAdopt.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('adopt-name').value;
  const type = document.getElementById('adopt-type').value;
  const sprite = document.getElementById('adopt-sprite').value;

  let newCat;
  if (type === "Domestique") newCat = new DomesticCat(name, sprite);
  else if (type === "Sauvage") newCat = new WildCat(name, sprite);
  else newCat = new Cat(name, sprite);

  const cats = JSON.parse(localStorage.getItem('cat_list') || '[]');
  cats.push(newCat.toJSON());
  localStorage.setItem('cat_list', JSON.stringify(cats));

  formAdopt.reset();
  sceneAdopt.style.display = 'none';
  sceneCatList.style.display = 'flex';
  renderCatList();
});

// ==========================================
// 2.6 Delete Confirmation
// ==========================================
const confirmDeleteDialog = document.getElementById('confirm-delete-dialog');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
let catIndexToDelete = null;

btnCancelDelete.addEventListener('click', () => {
  confirmDeleteDialog.close();
  catIndexToDelete = null;
});

btnConfirmDelete.addEventListener('click', () => {
  if (catIndexToDelete !== null) {
    const cats = JSON.parse(localStorage.getItem('cat_list') || '[]');
    cats.splice(catIndexToDelete, 1);
    localStorage.setItem('cat_list', JSON.stringify(cats));
    renderCatList();
  }
  confirmDeleteDialog.close();
  catIndexToDelete = null;
});

// On n'utilise plus de diagramme en cercle
// Rendu directement en barres HTML dans renderCatList

function renderCatList() {
  const cats = JSON.parse(localStorage.getItem('cat_list') || '[]');
  
  if (cats.length === 0) {
    catListEmptyMsg.style.display = 'block';
    catListItems.style.display = 'none';
  } else {
    catListEmptyMsg.style.display = 'none';
    catListItems.style.display = 'block';
    catListItems.innerHTML = '';

    cats.forEach((cat, index) => {
      const card = document.createElement('div');
      card.className = 'cat-card';
      
      const info = document.createElement('div');
      info.className = 'cat-card-info';
      info.innerHTML = `
        <div class="cat-card-name">${cat.name}</div>
        <div style="font-size:8px; color:#555;">Type: ${cat.type}</div>
      `;

      const statKeys = ['pv', 'attack', 'defense', 'speed', 'crit'];
      const labels = ['PV', 'ATK', 'DEF', 'VIT', 'CRI'];
      const maxValues = [150, 50, 30, 40, 30]; // Max arbitraire pour remplir les barres
      const colors = ['#ff4444', '#ff8800', '#ffcc00', '#44ff44', '#44aaff'];

      const statContainer = document.createElement('div');
      statContainer.className = 'stat-container';

      for (let i = 0; i < statKeys.length; i++) {
        const val = cat[statKeys[i]] || 0;
        const ratio = Math.min((val / maxValues[i]) * 100, 100);

        const row = document.createElement('div');
        row.className = 'stat-row';
        row.innerHTML = `
          <div class="stat-label">${labels[i]}</div>
          <div class="stat-bar-bg">
            <div class="stat-bar-fill" style="width: ${ratio}%; background-color: ${colors[i]};"></div>
          </div>
        `;
        statContainer.appendChild(row);
      }
      
      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn-delete';
      btnDelete.innerText = 'X';
      btnDelete.onclick = () => {
        catIndexToDelete = index;
        confirmDeleteDialog.showModal();
      };

      card.appendChild(info);
      card.appendChild(statContainer);
      card.appendChild(btnDelete);
      catListItems.appendChild(card);
    });
  }
}

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


