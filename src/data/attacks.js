// ==========================================
// Définition des actions de combat disponibles.
// - attack  : dégâts normaux, illimité
// - defense : posture défensive, réduit les dégâts subis, illimité
// - special : gros dégâts, rechargement 2 tours
// ==========================================

export const ACTIONS = {
  attack: {
    id: 'attack',
    label: 'Attaque',
    type: 'damage',
    multiplier: 1.0,
    cooldown: 0,
  },
  defense: {
    id: 'defense',
    label: 'Défense',
    type: 'defend',
    cooldown: 0,
  },
  special: {
    id: 'special',
    label: 'Spéciale',
    type: 'damage',
    multiplier: 1.9,
    critBonus: 12,
    cooldown: 2, // utilisable tous les 2 tours
  },
};

// Ordre d'affichage des 3 boutons d'action (le 4e bouton = Fuir).
export const PLAYER_ACTIONS = ['attack', 'defense', 'special'];

// Réduction de dégâts quand on est en posture défensive.
export const DEFEND_REDUCTION = 0.5;
