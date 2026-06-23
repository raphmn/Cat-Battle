// ==========================================
// Accès centralisé au localStorage.
// Toute lecture/écriture de données persistantes passe par ici.
// ==========================================

export const KEYS = {
  playerName: 'catbattle_player_name',
  catList: 'cat_list',
  progress: 'catbattle_progress',
};

// --- Profil joueur ---
export function getPlayerName() {
  return localStorage.getItem(KEYS.playerName) || 'Dresseur';
}

export function setPlayerName(name) {
  localStorage.setItem(KEYS.playerName, name);
}

// --- Liste des chats ---
export function getCats() {
  return JSON.parse(localStorage.getItem(KEYS.catList) || '[]');
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

// --- Progression (plus haut niveau débloqué) ---
export function getUnlockedLevel() {
  return parseInt(localStorage.getItem(KEYS.progress) || '1', 10);
}

export function unlockLevel(levelId) {
  if (levelId > getUnlockedLevel()) {
    localStorage.setItem(KEYS.progress, String(levelId));
  }
}
