// ==========================================
// Actions de combat (CdC §3.3).
// - griffer : attaque normale, crit possible (crit dérivé de vit)
// - special : COUP SPÉCIAL, dégâts ×1.55 mais ~22% de raté
// - abri    : ABRI, bloque 100% des dégâts du tour, pas 2 tours de suite
// (Fuir est géré à part : fin de combat immédiate, sans résultat.)
// ==========================================

export const ACTIONS = {
  griffer: {
    id: 'griffer',
    label: 'GRIFFER',
    type: 'damage',
    mult: 1.0,
  },
  special: {
    id: 'special',
    label: 'COUP SPÉCIAL',
    type: 'damage',
    mult: 1.55,
    missChance: 0.22,
  },
  abri: {
    id: 'abri',
    label: 'ABRI',
    type: 'shield',
  },
};

// Ordre des 3 boutons d'action (le 4e bouton = Fuir).
export const PLAYER_ACTIONS = ['griffer', 'special', 'abri'];
