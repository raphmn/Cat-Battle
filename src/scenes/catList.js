// ==========================================
// Scène Liste des Chats + formulaire d'Adoption + suppression.
// Modèle de données aligné CdC : atk/def/vit/maxpv, type en minuscules.
// ==========================================

import { navigate } from '../core/sceneManager.js';
import { getCats, addCat, deleteCat } from '../core/storage.js';
import { Cat, DomesticCat, WildCat } from '../entities/Cat.js';
import { ITEMS, itemLabel } from '../data/items.js';

// slider 0/1/2 -> type stocké + libellé affiché
const TYPE_MAPPING = {
  0: { type: 'domestique', label: 'Domestique', color: '#44aaff' },
  1: { type: 'base', label: 'Base', color: '#ffcc00' },
  2: { type: 'sauvage', label: 'Sauvage', color: '#ff4444' },
};

const ASSET_OPTIONS = ['🐱', '🐈', '🐈‍⬛', '😺', '😼', '🐯', '🦁'];

let catIndexToDelete = null;

export function initCatList() {
  const btnBackCatList = document.getElementById('btn-back-cat-list');
  const btnAdopt = document.getElementById('btn-adopt');
  const btnCancelAdopt = document.getElementById('btn-cancel-adopt');
  const formAdopt = document.getElementById('form-adopt');
  const sliderType = document.getElementById('adopt-type-slider');
  const displayType = document.getElementById('adopt-type-display');
  const assetSelect = document.getElementById('adopt-sprite');
  const itemSelect = document.getElementById('adopt-item');
  const confirmDeleteDialog = document.getElementById('confirm-delete-dialog');

  // Sprites (emoji) disponibles à l'adoption
  ASSET_OPTIONS.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    assetSelect.appendChild(opt);
  });

  // Objets équipables (le premier <option> "Vide" est déjà dans le HTML)
  Object.values(ITEMS).forEach((item) => {
    if (!item.id) return;
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = `${item.icon} ${item.name}`;
    itemSelect.appendChild(opt);
  });

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
    displayType.innerText = config.label;
    displayType.style.color = config.color;
    sliderType.style.setProperty('--slider-color', config.color);
    displayType.classList.remove('type-animated');
    void displayType.offsetWidth;
    displayType.classList.add('type-animated');
  });

  btnCancelAdopt.addEventListener('click', () => {
    navigate('catList');
    formAdopt.reset();
  });

  formAdopt.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('adopt-name').value;
    const type = TYPE_MAPPING[sliderType.value].type;
    const asset = assetSelect.value;

    let newCat;
    if (type === 'domestique') newCat = new DomesticCat(name, asset);
    else if (type === 'sauvage') newCat = new WildCat(name, asset);
    else newCat = new Cat(name, asset);
    newCat.item = itemSelect.value || null;

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

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
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

  const statKeys = ['maxpv', 'atk', 'def', 'vit'];
  const labels = ['PV', 'ATK', 'DEF', 'VIT'];
  const maxValues = [150, 50, 30, 40];
  const colors = ['#ff4444', '#ff8800', '#ffcc00', '#44ff44'];

  cats.forEach((cat, index) => {
    const card = document.createElement('div');
    card.className = 'cat-card';

    const info = document.createElement('div');
    info.className = 'cat-card-info';
    const itemTxt = itemLabel(cat.item);
    info.innerHTML = `
      <div class="cat-card-name">${cat.asset || ''} ${cat.name}</div>
      <div style="font-size:8px; color:#555;">${capitalize(cat.type)} · Niv.${cat.lvl} · ${cat.wins} victoire(s)</div>
      ${itemTxt ? `<div class="cat-card-item">${itemTxt}</div>` : ''}
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
