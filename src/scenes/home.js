// ==========================================
// Scène d'accueil : profil joueur, menu principal, paramètres audio.
// ==========================================

import { navigate } from '../core/sceneManager.js';
import { getPlayerName, setPlayerName, getCats, getPoints, setPoints, getInventory, addToInventory } from '../core/storage.js';
import { setMusicVolume, setSfxVolume, playSfx, sfxFail, sfxWin } from '../core/audio.js';
import { startRandomBattle } from './levelSelect.js';

export function initHome() {
  const nameEl = document.getElementById('player-name');
  const profile = document.getElementById('player-profile');
  nameEl.textContent = getPlayerName();

  // Notification overlay
  const notificationDialog = document.getElementById('notification-dialog');
  const notificationText = document.getElementById('notification-text');
  document.getElementById('btn-close-notification').addEventListener('click', () => {
    playSfx();
    notificationDialog.close();
  });

  function showNotification(msg) {
    notificationText.textContent = msg;
    notificationDialog.showModal();
  }

  // Initialisation du compteur de points
  document.getElementById('point-amount').textContent = getPoints();

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

  // Boutique (Shop)
  const shopDialog = document.getElementById('shop-dialog');
  document.getElementById('point-counter').addEventListener('click', () => {
    playSfx();
    shopDialog.showModal();
  });
  document.getElementById('btn-close-shop').addEventListener('click', () => {
    playSfx();
    shopDialog.close();
  });

  document.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const shopItem = e.target.closest('.shop-item');
      const itemId = shopItem.dataset.id;
      const price = parseInt(shopItem.dataset.price, 10);
      let points = getPoints();
      if (points >= price) {
        setPoints(points - price);
        document.getElementById('point-amount').textContent = getPoints();
        addToInventory(itemId, 1);
        sfxWin();
        showNotification('Achat réussi !');
      } else {
        sfxFail();
        showNotification("Pas assez de points !");
      }
    });
  });

  // Inventaire
  const inventoryDialog = document.getElementById('inventory-dialog');
  const inventoryList = document.getElementById('inventory-list');
  const ITEM_DETAILS = {
    'heal': { name: 'Soin', icon: '/items/Heal.png' },
    'revive': { name: 'Potion spéciale', icon: '/items/revive_potion.png' }
  };

  document.getElementById('btn-inventory').addEventListener('click', () => {
    const inv = getInventory();
    inventoryList.innerHTML = '';
    const keys = Object.keys(inv).filter(k => inv[k] > 0);

    if (keys.length === 0) {
      inventoryList.innerHTML = '<p style="color: #666; font-style: italic;">Votre inventaire est vide.</p>';
    } else {
      keys.forEach(k => {
        const item = ITEM_DETAILS[k];
        if (!item) return;
        const el = document.createElement('div');
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'space-between';
        el.style.width = '100%';
        el.style.padding = '8px 12px';
        el.style.boxSizing = 'border-box';
        el.style.borderBottom = '1px solid rgba(0,0,0,0.1)';

        el.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${item.icon}" style="width:24px; height:24px; image-rendering: pixelated; filter: drop-shadow(1px 1px 0 rgba(0,0,0,0.3));" />
            <span style="font-size: 12px;">${item.name}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-weight: bold;">x${inv[k]}</span>
            <button class="retro-button btn-use-item" data-id="${k}" style="padding: 6px 10px; font-size: 9px; background-color: #44aaff; color: white;">Utiliser</button>
          </div>
        `;
        inventoryList.appendChild(el);
      });
    }
    inventoryDialog.showModal();
  });
  document.getElementById('btn-close-inventory').addEventListener('click', () => inventoryDialog.close());

  // Use Item Dialog
  const useItemDialog = document.getElementById('use-item-dialog');
  const useItemList = document.getElementById('use-item-list');
  document.getElementById('btn-close-use-item').addEventListener('click', () => useItemDialog.close());

  inventoryList.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-use-item')) {
      const itemId = e.target.dataset.id;
      if (itemId === 'revive') {
        const cats = getCats();
        const koCats = cats.map((c, index) => ({ ...c, index })).filter(c => c.ko);

        if (koCats.length > 0) {
          useItemList.innerHTML = '';
          koCats.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'retro-button';
            btn.style.padding = '10px';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.gap = '10px';
            btn.innerHTML = `${assetMarkup(c.asset || '🐱', 24)} <span>${c.name} (K.O.)</span>`;

            btn.onclick = () => {
              const updatedCats = getCats();
              updatedCats[c.index].ko = false;
              saveCats(updatedCats);
              addToInventory('revive', -1);
              playSfx();
              showNotification(`${c.name} a été ranimé !`);
              useItemDialog.close();
              inventoryDialog.close();
            };

            useItemList.appendChild(btn);
          });
          useItemDialog.showModal();
        } else {
          showNotification("Aucun de vos chats n'est K.O. !");
        }
      } else {
        showNotification("Cet objet ne peut être utilisé que pendant un combat ou n'a pas d'effet actuellement.");
      }
    }
  });

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
