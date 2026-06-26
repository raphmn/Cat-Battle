// ==========================================
// Scène Choix de la Difficulté (CdC US07) : 3 niveaux de bot (1/2/3),
// puis choix du chat combattant (dialog) avant de lancer le combat.
// ==========================================

import { register, navigate } from '../core/sceneManager.js';
import { BOT_LEVELS } from '../data/levels.js';
import { getCats, getHistory } from '../core/storage.js';
import { startBattle } from './battle.js';
import { assetMarkup } from '../core/asset.js';

let grid, picker, pickerList, pendingLevel, pendingRandom;

export function initLevelSelect() {
  const root = document.createElement('div');
  root.id = 'scene-level-select';
  root.className = 'scene';
  root.style.display = 'none';
  root.innerHTML = `
    <button class="btn-back" id="btn-back-levels">⬅ Retour</button>
    <div class="scene-title">Niveaux</div>
    <div class="level-grid"></div>
  `;
  document.getElementById('game-container').appendChild(root);
  register('levelSelect', root, 'flex');

  grid = root.querySelector('.level-grid');
  root.querySelector('#btn-back-levels').addEventListener('click', () => navigate('home'));

  // Dialog de choix du chat
  picker = document.createElement('dialog');
  picker.id = 'cat-picker-dialog';
  picker.innerHTML = `
    <p>Choisis ton chat</p>
    <div class="picker-list"></div>
    <button class="retro-button picker-cancel" style="font-size:10px; padding:10px;">Annuler</button>
  `;
  document.getElementById('game-container').appendChild(picker);
  pickerList = picker.querySelector('.picker-list');
  picker.querySelector('.picker-cancel').addEventListener('click', () => picker.close());

  window.addEventListener('scene:change', (e) => {
    if (e.detail === 'levelSelect') renderLevels();
  });
}

const BAND_COLORS = { Facile: '#58a060', Moyen: '#d8a000', Difficile: '#e05050' };

function renderLevels() {
  grid.innerHTML = '';
  const history = getHistory();

  BOT_LEVELS.forEach((lv) => {
    const b = lv.base;
    const hasPlayed = history.some(h => h.level === lv.level && h.result === 'win');
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    btn.style.boxShadow = `inset 0 0 0 4px ${BAND_COLORS[lv.label]}, 4px 4px 0 rgba(0,0,0,.5)`;
    if (hasPlayed) {
      btn.style.backgroundColor = '#e8ffe8'; // Vert très clair
    }
    btn.innerHTML = `
      <div class="lvl-num">Niv.${lv.level}</div>
      <div class="lvl-enemy">${lv.label}</div>
      <div class="lvl-meta">PV ${b.maxpv} · ATK ${b.atk}<br>DEF ${b.def} · VIT ${b.vit}</div>
    `;
    btn.addEventListener('click', () => openPicker(lv.level));
    grid.appendChild(btn);
  });
}

// Lance le mode "full aléatoire" (bouton du menu d'accueil).
export function startRandomBattle() {
  openPicker(0, true);
}

function openPicker(level, random = false) {
  const cats = getCats();
  if (cats.length === 0) {
    navigate('catList');
    return;
  }
  if (cats.length === 1) {
    if (!cats[0].ko) {
      startBattle(level, 0, random);
    }
    return;
  }

  pendingLevel = level;
  pendingRandom = random;
  pickerList.innerHTML = '';
  cats.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'picker-cat retro-button';
    if (c.ko) {
      btn.style.filter = 'grayscale(100%)';
      btn.style.opacity = '0.5';
      btn.innerHTML = `${assetMarkup(c.asset || '🐱', 20)} ${c.name} <span style="font-size:8px;">Niv.${c.lvl} (K.O.)</span>`;
      btn.addEventListener('click', () => {}); // Ne rien faire
    } else {
      btn.innerHTML = `${assetMarkup(c.asset || '🐱', 20)} ${c.name} <span style="font-size:8px;">Niv.${c.lvl}</span>`;
      btn.addEventListener('click', () => {
        picker.close();
        startBattle(pendingLevel, i, pendingRandom);
      });
    }
    pickerList.appendChild(btn);
  });
  picker.showModal();
}
