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
    description: 'Dégâts normaux infligés selon l’ATK du chat.',
  },
  special: {
    id: 'special',
    label: 'COUP SPÉCIAL',
    type: 'damage',
    mult: 1.55,
    missChance: 0.22,
    cooldown: 3, // utilisable tous les 3 tours (2 tours de recharge)
    selfCost: 5,
    description: 'Dégâts plus puissants (×1.55) avec ~22% de chance de rater. Coûte 5 PV. Rechargé en 2 tours.',
  },
  abri: {
    id: 'abri',
    label: 'ABRI',
    type: 'shield',
    noConsecutive: true, // pas 2 tours de suite
    description: 'Protège contre tous les dégâts du tour actuel.',
  },
};
