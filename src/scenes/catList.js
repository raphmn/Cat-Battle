// ==========================================
// Scène Liste des Chats + formulaire d'Adoption + suppression.
// ==========================================

import { navigate } from '../core/sceneManager.js';
import { getCats, addCat, deleteCat } from '../core/storage.js';
import { Cat, DomesticCat, WildCat } from '../entities/Cat.js';

const TYPE_MAPPING = {
  0: { name: 'Domestique', color: '#44aaff' },
  1: { name: 'Base', color: '#ffcc00' },
  2: { name: 'Sauvage', color: '#ff4444' },
};

const SPRITE_OPTIONS = ['🐱', '🐈', '🐈‍⬛', '😺', '😼', '🐯', '🦁'];

let catIndexToDelete = null;

export function initCatList() {
  const sceneCatList = document.getElementById('scene-cat-list');
  const sceneAdopt = document.getElementById('scene-adopt');
  const btnBackCatList = document.getElementById('btn-back-cat-list');
  const btnAdopt = document.getElementById('btn-adopt');
  const btnCancelAdopt = document.getElementById('btn-cancel-adopt');
  const formAdopt = document.getElementById('form-adopt');
  const sliderType = document.getElementById('adopt-type-slider');
  const displayType = document.getElementById('adopt-type-display');
  const spriteSelect = document.getElementById('adopt-sprite');
  const confirmDeleteDialog = document.getElementById('confirm-delete-dialog');

  // Ajoute les sprites (emoji) disponibles à l'adoption
  SPRITE_OPTIONS.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    spriteSelect.appendChild(opt);
  });

  // Rafraîchit la liste quand la scène devient visible
  window.addEventListener('scene:change', (e) => {
    if (e.detail === 'catList') renderCatList();
  });

  btnBackCatList.addEventListener('click', () => navigate('home'));

  // --- Adoption ---
  btnAdopt.addEventListener('click', () => {
    if (getCats().length >= 5) {
      alert('Vous ne pouvez pas avoir plus de 5 chats !');
      return;
    }
    navigate('adopt');
    sliderType.value = 1;
    displayType.innerText = 'Base';
    displayType.style.color = '#ffcc00';
    sliderType.style.setProperty('--slider-color', '#ffcc00');
  });

  sliderType.addEventListener('input', (e) => {
    const config = TYPE_MAPPING[e.target.value];
    displayType.innerText = config.name;
    displayType.style.color = config.color;
    sliderType.style.setProperty('--slider-color', config.color);
    displayType.classList.remove('type-animated');
    void displayType.offsetWidth; // force un reflow pour relancer l'anim
    displayType.classList.add('type-animated');
  });

  btnCancelAdopt.addEventListener('click', () => {
    navigate('catList');
    formAdopt.reset();
  });

  formAdopt.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('adopt-name').value;
    const type = TYPE_MAPPING[sliderType.value].name;
    const sprite = spriteSelect.value;

    let newCat;
    if (type === 'Domestique') newCat = new DomesticCat(name, sprite);
    else if (type === 'Sauvage') newCat = new WildCat(name, sprite);
    else newCat = new Cat(name, sprite);

    addCat(newCat.toJSON());
    formAdopt.reset();
    navigate('catList');
  });

  // --- Suppression ---
  document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    confirmDeleteDialog.close();
    catIndexToDelete = null;
  });

  document.getElementById('btn-confirm-delete').addEventListener('click', () => {
    if (catIndexToDelete !== null) {
      deleteCat(catIndexToDelete);
      renderCatList();
    }
    confirmDeleteDialog.close();
    catIndexToDelete = null;
  });
}

function renderCatList() {
  const cats = getCats();
  const catListEmptyMsg = document.getElementById('cat-list-empty-msg');
  const catListItems = document.getElementById('cat-list-items');
  const confirmDeleteDialog = document.getElementById('confirm-delete-dialog');

  if (cats.length === 0) {
    catListEmptyMsg.style.display = 'block';
    catListItems.style.display = 'none';
    return;
  }

  catListEmptyMsg.style.display = 'none';
  catListItems.style.display = 'block';
  catListItems.innerHTML = '';

  const statKeys = ['pv', 'attack', 'defense', 'speed', 'crit'];
  const labels = ['PV', 'ATK', 'DEF', 'VIT', 'CRI'];
  const maxValues = [150, 50, 30, 40, 30];
  const colors = ['#ff4444', '#ff8800', '#ffcc00', '#44ff44', '#44aaff'];

  cats.forEach((cat, index) => {
    const card = document.createElement('div');
    card.className = 'cat-card';

    const info = document.createElement('div');
    info.className = 'cat-card-info';
    info.innerHTML = `
      <div class="cat-card-name">${cat.sprite || ''} ${cat.name}</div>
      <div style="font-size:8px; color:#555;">Type: ${cat.type} · Niv.${cat.level || 5}</div>
    `;

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
