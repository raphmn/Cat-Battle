// ==========================================
// Accès centralisé au localStorage.
// getCats() NORMALISE les enregistrements pour suivre le modèle du CdC
// (atk/def/vit/maxpv/lvl/wins/asset) tout en migrant les anciens chats
// (attack/defense/speed/pv/level/sprite/crit).
// ==========================================

export const KEYS = {
  playerName: 'catbattle_player_name',
  catList: 'cat_list',
  history: 'catbattle_history',
  points: 'catbattle_points',
  inventory: 'catbattle_inventory',
};

const HISTORY_MAX = 50;

// --- Profil joueur ---
export function getPlayerName() {
  return localStorage.getItem(KEYS.playerName) || 'Dresseur';
}

export function setPlayerName(name) {
  localStorage.setItem(KEYS.playerName, name);
}

// --- Points ---
export function getPoints() {
  const p = localStorage.getItem(KEYS.points);
  return p ? parseInt(p, 10) : 0;
}

export function setPoints(amount) {
  localStorage.setItem(KEYS.points, amount.toString());
}

// --- Inventaire In-Game ---
export function getInventory() {
  const inv = localStorage.getItem(KEYS.inventory);
  return inv ? JSON.parse(inv) : {};
}

export function addToInventory(itemId, amount = 1) {
  const inv = getInventory();
  inv[itemId] = (inv[itemId] || 0) + amount;
  localStorage.setItem(KEYS.inventory, JSON.stringify(inv));
}

// --- Liste des chats ---
function normalizeCat(c) {
  return {
    id: c.id || Date.now().toString(36) + Math.random().toString(36).slice(2),
    name: c.name || 'Chat',
    asset: c.asset ?? c.sprite ?? '',
    type: (c.type || 'base').toLowerCase(),
    items: c.items
      ? Array.isArray(c.items)
        ? c.items
        : [c.items]
      : c.item
        ? [c.item]
        : [],
    item: c.item ?? null,
    lvl: c.lvl ?? c.level ?? 1,
    wins: c.wins ?? 0,
    maxpv: c.maxpv ?? c.pv ?? 100,
    atk: c.atk ?? c.attack ?? 20,
    def: c.def ?? c.defense ?? 10,
    vit: c.vit ?? c.speed ?? 15,
  };
}

export function getCats() {
  const raw = JSON.parse(localStorage.getItem(KEYS.catList) || '[]');
  return raw.map(normalizeCat);
}

export function saveCats(cats) {
  localStorage.setItem(KEYS.catList, JSON.stringify(cats));
}

export function addCat(catJSON) {
  const cats = getCats();
  cats.push(catJSON);
  saveCats(cats);
}

export function deleteCat(index) {
  const cats = getCats();
  cats.splice(index, 1);
  saveCats(cats);
}

// --- Historique des combats (CdC US11) ---
export function getHistory() {
  return JSON.parse(localStorage.getItem(KEYS.history) || '[]');
}

export function addHistoryEntry(entry) {
  const h = getHistory();
  h.unshift(entry); // le plus récent en premier
  localStorage.setItem(KEYS.history, JSON.stringify(h.slice(0, HISTORY_MAX)));
}
