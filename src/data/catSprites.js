// ==========================================
// Sprites de chats (pixel-art). Chaque race a une vue de face (front, pour
// l'ennemi / l'adoption / les listes) et une vue de dos (back, pour le chat
// du joueur en combat). Les deux planches sont découpées en 9 cases alignées.
// ==========================================

const BREEDS = [
  { id: 'noir', name: 'Noir' },
  { id: 'roux', name: 'Roux' },
  { id: 'calico', name: 'Calico' },
  { id: 'blanc', name: 'Blanc' },
  { id: 'gris-tigre', name: 'Gris tigré' },
  { id: 'creme', name: 'Crème' },
  { id: 'marron', name: 'Marron' },
  { id: 'gris', name: 'Gris' },
  { id: 'ecaille', name: 'Écaille' },
];

const FRONT_DIR = '/sprites/cats/front/';
const BACK_DIR = '/sprites/cats/back/';

// [{ id, name, front, back, asset(=front, pour la compat existante) }]
export const CAT_SPRITES = BREEDS.map((b, i) => {
  const front = `${FRONT_DIR}${i}.png`;
  return { id: b.id, name: b.name, front, back: `${BACK_DIR}${i}.png`, asset: front };
});

export const CAT_SPRITE_ASSETS = CAT_SPRITES.map((c) => c.asset);

// Renvoie la vue de dos correspondant à une vue de face (chat du joueur en
// combat). Pour une photo détourée ou un emoji, renvoie l'asset inchangé.
export function toBackSprite(asset) {
  return typeof asset === 'string' ? asset.replace(FRONT_DIR, BACK_DIR) : asset;
}
