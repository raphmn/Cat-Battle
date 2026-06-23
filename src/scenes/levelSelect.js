// ==========================================
// Scène Sélection de Niveau : grille de niveaux (verrouillés/débloqués)
// puis choix du chat combattant (dialog) avant de lancer le combat.
// ==========================================

import { register, navigate } from '../core/sceneManager.js';
import { getAllLevels } from '../data/levels.js';
import { getUnlockedLevel, getCats } from '../core/storage.js';
import { startBattle } from './battle.js';

let grid, picker, pickerList, pendingLevel;

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

function renderLevels() {
  const unlocked = getUnlockedLevel();
  grid.innerHTML = '';

  getAllLevels().forEach((lv) => {
    const locked = lv.id > unlocked;
    const btn = document.createElement('button');
    btn.className = 'level-btn' + (locked ? ' locked' : '') + (lv.isBoss ? ' boss' : '');
    btn.innerHTML = `
      <div class="lvl-num">${locked ? '🔒' : (lv.isBoss ? '👑' : lv.id)}</div>
      <div class="lvl-enemy">${lv.enemy.sprite} ${lv.isBoss ? 'BOSS' : lv.enemy.name}</div>
      <div class="lvl-meta">Niv.${lv.enemy.level}</div>
    `;
    if (!locked) btn.addEventListener('click', () => openPicker(lv));
    grid.appendChild(btn);
  });
}

function openPicker(level) {
  const cats = getCats();
  if (cats.length === 0) {
    alert("Adopte un chat d'abord ! (menu Liste Chats)");
    return;
  }
  if (cats.length === 1) {
    startBattle(level, 0);
    return;
  }

  pendingLevel = level;
  pickerList.innerHTML = '';
  cats.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'picker-cat retro-button';
    b.innerHTML = `${c.sprite || '🐱'} ${c.name} <span style="font-size:8px;">Niv.${c.level || 5}</span>`;
    b.addEventListener('click', () => {
      picker.close();
      startBattle(pendingLevel, i);
    });
    pickerList.appendChild(b);
  });
  picker.showModal();
}
