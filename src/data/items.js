// ==========================================
// Objets équipables (CdC Could) : bonus de statistique en pourcentage,
// appliqués au chat pendant le combat (non permanents).
// ==========================================

export const ITEMS = {
  '': { id: '', name: 'Aucun', image: '' },
  patee: {
    id: 'patee',
    name: 'Pâtée',
    description: 'Renforce les PV du chat tout en le ralentissant légèrement.',
    image: '/items/Cat-food-removebg-preview_1.png',
    bonus: { maxpv: 20, vit: -4, atk: -3 },
  },
  collier: {
    id: 'collier',
    name: 'Collier',
    description: 'Améliore la défense en combat avec une petite perte de vitesse.',
    image: '/items/Collier_chat-removebg-preview_1.png',
    bonus: { def: 6, vit: -2 },
  },
  peluche: {
    id: 'peluche',
    name: 'Peluche',
    description: 'Calme le chat et renforce sa régénération, au coût d’une attaque plus faible.',
    image: '/items/Peluche-removebg-preview_1.png',
    bonus: { atk: -4 },
  },
  herbe: {
    id: 'herbe',
    name: 'Herbe à chat',
    description: 'Stimule la vitesse et les coups spéciaux, mais réduit la résistance.',
    image: '/items/Herbe-chat-removebg-preview_1.png',
    bonus: { vit: 5, def: -5, maxpv: -8 },
  },
};

// Renvoie une copie des stats avec les bonus d'items appliqués (% arrondi).
export function applyItemBonus(stats, itemIds) {
  const out = { ...stats };
  
  // Gérer à la fois un simple ID et un array d'IDs (backward compatibility)
  const ids = Array.isArray(itemIds) ? itemIds : (itemIds ? [itemIds] : []);
  
  ids.forEach((itemId) => {
    const item = ITEMS[itemId];
    if (item && item.bonus) {
      for (const [stat, value] of Object.entries(item.bonus)) {
        const base = out[stat] || 0;
        if (typeof value === 'number') {
          if (Math.abs(value) < 1) {
            out[stat] = Math.round(base * (1 + value));
          } else {
            out[stat] = Math.max(0, base + value);
          }
        } else if (value && typeof value === 'object') {
          if ('add' in value) out[stat] = Math.max(0, base + value.add);
          else if ('mult' in value) out[stat] = Math.round(base * value.mult);
        }
      }
    }
  });
  return out;
}

export function itemLabel(itemId) {
  const item = ITEMS[itemId];
  return item && item.id ? item.name : '';
}
