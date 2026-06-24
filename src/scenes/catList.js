// ==========================================
// Scène Liste des Chats + formulaire d'Adoption + suppression.
// Modèle de données aligné CdC : atk/def/vit/maxpv, type en minuscules.
// ==========================================

import { navigate } from '../core/sceneManager.js';
import { getCats, addCat, deleteCat } from '../core/storage.js';
import { Cat, DomesticCat, WildCat } from '../entities/Cat.js';
import { ITEMS } from '../data/items.js';
import { assetMarkup, photoToSprite } from '../core/asset.js';

// slider 0/1/2 -> type stocké + libellé affiché
const TYPE_MAPPING = {
  0: {
    type: 'domestique',
    label: 'Domestique',
    color: '#44aaff',
    description: 'Beaucoup de PV et de défense, mais moins rapide en attaque.',
  },
  1: {
    type: 'base',
    label: 'Base',
    color: '#ffcc00',
    description: 'Un bon compromis en vie, défense, attaque et vitesse.',
  },
  2: {
    type: 'sauvage',
    label: 'Sauvage',
    color: '#ff4444',
    description: 'Très fort et rapide, mais plus fragile en PV et défense.',
  },
};
TYPE_MAPPING.domestique = TYPE_MAPPING[0];
TYPE_MAPPING.base = TYPE_MAPPING[1];
TYPE_MAPPING.sauvage = TYPE_MAPPING[2];

const ASSET_OPTIONS = ['🐱', '🐈', '🐈‍⬛', '😺', '😼', '🐯', '🦁'];

let catIndexToDelete = null;

export function initCatList() {
  const btnBackCatList = document.getElementById('btn-back-cat-list');
  const btnAdopt = document.getElementById('btn-adopt');
  const btnCancelAdopt = document.getElementById('btn-cancel-adopt');
  const formAdopt = document.getElementById('form-adopt');
  const sliderType = document.getElementById('adopt-type-slider');
  const displayType = document.getElementById('adopt-type-display');
  const displayTypeDescription = document.getElementById('adopt-type-description');
  const assetSelect = document.getElementById('adopt-sprite');
  const itemsListContainer = document.getElementById('adopt-items-list');
  const itemsDropZone = document.getElementById('adopt-items-drop');
  const equippedItemsContainer = document.getElementById('adopt-equipped-items');
  const confirmDeleteDialog = document.getElementById('confirm-delete-dialog');
  const photoInput = document.getElementById('adopt-photo');
  const photoStatus = document.getElementById('adopt-photo-status');
  const photoPreview = document.getElementById('adopt-photo-preview');
  const photoImg = document.getElementById('adopt-photo-img');
  const photoClear = document.getElementById('adopt-photo-clear');

  let adoptEquippedItems = [];
  let adoptPhotoAsset = null; // sprite détouré (data URL) ou null

  const resetPhoto = () => {
    adoptPhotoAsset = null;
    if (photoInput) photoInput.value = '';
    if (photoPreview) photoPreview.style.display = 'none';
    if (photoStatus) photoStatus.style.display = 'none';
  };

  if (photoInput) {
    photoInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      photoStatus.style.display = 'block';
      photoStatus.style.color = '#666';
      photoStatus.textContent = 'Détourage en cours… (peut être long au 1er usage)';
      photoPreview.style.display = 'none';
      try {
        adoptPhotoAsset = await photoToSprite(file);
        photoImg.src = adoptPhotoAsset;
        photoPreview.style.display = 'block';
        photoStatus.style.display = 'none';
      } catch (err) {
        console.error(err);
        adoptPhotoAsset = null;
        photoStatus.style.color = '#c33';
        photoStatus.textContent = 'Échec du détourage. Réessaie avec une autre photo.';
      }
    });
  }
  if (photoClear) photoClear.addEventListener('click', resetPhoto);

  // Sprites (emoji) disponibles à l'adoption
  ASSET_OPTIONS.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    assetSelect.appendChild(opt);
  });

  // Créer la liste des objets draggables
  const renderItemsList = () => {
    itemsListContainer.innerHTML = '';
    Object.values(ITEMS).forEach((item) => {
      if (!item.id) return;
      const itemEl = document.createElement('div');
      itemEl.draggable = true;
      itemEl.style.cssText = 'cursor: grab; padding: 8px; background: #f8f8f8; border: 2px solid #333; border-radius: 6px; text-align: center; font-size: 10px; font-weight: 800; user-select: none; display: flex; align-items: center; justify-content: center;';
      itemEl.dataset.itemId = item.id;
      itemEl.title = item.name;
      itemEl.innerHTML = `
        <img src="${item.image}" alt="${item.name}" style="width:40px; height:40px; object-fit:contain;">
      `;
      itemEl.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', item.id);
      });
      itemsListContainer.appendChild(itemEl);
    });
  };
  renderItemsList();

  // Gestion du drop zone
  itemsDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    itemsDropZone.style.background = '#ffe0e0';
  });

  itemsDropZone.addEventListener('dragleave', () => {
    itemsDropZone.style.background = '#f6f0df';
  });

  itemsDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    itemsDropZone.style.background = '#f6f0df';
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId && !adoptEquippedItems.includes(itemId) && adoptEquippedItems.length < 2) {
      adoptEquippedItems.push(itemId);
      renderEquippedItems();
    }
  });

  const renderEquippedItems = () => {
    equippedItemsContainer.innerHTML = '';
    adoptEquippedItems.forEach((itemId, idx) => {
      const item = ITEMS[itemId];
      if (!item) return;
      const itemEl = document.createElement('div');
      itemEl.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 10px; background: #f6f0df; border: 2px solid #333; border-radius: 6px; position: relative; text-align: center; min-width: 80px; gap: 6px;';
      itemEl.innerHTML = `
        <img src="${item.image}" alt="${item.name}" style="width: 48px; height: 48px; object-fit: contain;">
        <div style="font-size: 8px; color: #555; line-height: 1.2; word-break: break-word; max-width: 75px;">${item.description}</div>
        <button type="button" style="position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; background: #ff4444; color: white; border: 1px solid #000; border-radius: 3px; padding: 0; cursor: pointer; font-size: 10px; font-weight: bold;">×</button>
      `;
      itemEl.querySelector('button').addEventListener('click', () => {
        adoptEquippedItems.splice(idx, 1);
        renderEquippedItems();
      });
      equippedItemsContainer.appendChild(itemEl);
    });
  };

  window.addEventListener('scene:change', (e) => {
    if (e.detail === 'catList') {
      renderCatList();
      updateCatListState();
    }
  });

  btnBackCatList.addEventListener('click', () => navigate('home'));

  // --- Adoption ---
  const updateCatListState = () => {
    const maxReachedMsg = document.getElementById('cat-list-max-reached');
    const catCount = getCats().length;
    if (catCount >= 5) {
      btnAdopt.style.display = 'none';
      if (maxReachedMsg) maxReachedMsg.style.display = 'block';
    } else {
      btnAdopt.style.display = 'block';
      if (maxReachedMsg) maxReachedMsg.style.display = 'none';
    }
  };
  const updateAdoptTypeInfo = (value) => {
    const config = TYPE_MAPPING[value];
    displayType.innerText = config.label;
    displayType.style.color = config.color;
    displayTypeDescription.innerText = `${config.label} : ${config.description}`;
    sliderType.style.setProperty('--slider-color', config.color);
    displayType.classList.remove('type-animated');
    void displayType.offsetWidth;
    displayType.classList.add('type-animated');
  };

  btnAdopt.addEventListener('click', () => {
    if (getCats().length >= 5) {
      alert('Vous ne pouvez pas avoir plus de 5 chats !');
      return;
    }
    navigate('adopt');
    sliderType.value = 1;
    adoptEquippedItems = [];
    renderEquippedItems();
    itemsDropZone.style.background = '#f6f0df';
    formAdopt.reset();
    resetPhoto();
    updateAdoptTypeInfo(1);
  });

  sliderType.addEventListener('input', (e) => {
    updateAdoptTypeInfo(e.target.value);
  });

  btnCancelAdopt.addEventListener('click', () => {
    navigate('catList');
    formAdopt.reset();
    adoptEquippedItems = [];
    resetPhoto();
    updateCatListState();
  });

  formAdopt.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('adopt-name').value;
    const type = TYPE_MAPPING[sliderType.value].type;
    const asset = adoptPhotoAsset || assetSelect.value; // photo détourée prioritaire

    let newCat;
    if (type === 'domestique') newCat = new DomesticCat(name, asset);
    else if (type === 'sauvage') newCat = new WildCat(name, asset);
    else newCat = new Cat(name, asset);
    newCat.items = [...adoptEquippedItems];

    addCat(newCat.toJSON());
    formAdopt.reset();
    adoptEquippedItems = [];
    resetPhoto();
    updateCatListState();
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
      updateCatListState();
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
    const progress = (cat.wins || 0) % 3; // victoires depuis le dernier niveau
    const typeInfo = TYPE_MAPPING[cat.type] || TYPE_MAPPING.base;
    info.innerHTML = `
      <div class="cat-card-name">${assetMarkup(cat.asset, 28)} ${cat.name}</div>
      <div style="font-size:10px; color:#555; margin-bottom:4px;">${typeInfo.label} · Niv.${cat.lvl}</div>
      <div class="cat-type-description">${typeInfo.label} : ${typeInfo.description}</div>
      <div style="font-size:10px; color:#777; margin-top:6px;">${cat.wins} victoire(s) · niv. suivant ${progress}/3</div>
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

    const items = Array.isArray(cat.items)
      ? cat.items.filter(Boolean)
      : cat.item
      ? [cat.item]
      : [];

    if (items && items.length > 0) {
      items.forEach((itemId) => {
        const item = ITEMS[itemId];
        if (!item) return;
        const itemBlock = document.createElement('div');
        itemBlock.className = 'cat-card-item';
        itemBlock.innerHTML = `
          <img src="${item.image}" alt="${item.name}">
          <div class="cat-card-item-meta">
            <div class="cat-card-item-description">${item.description}</div>
          </div>
        `;
        card.appendChild(itemBlock);
      });
    }

    catListItems.appendChild(card);
  });
}
