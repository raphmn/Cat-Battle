// ==========================================
// Objets équipables (CdC Could) : bonus de statistique en pourcentage,
// appliqués au chat pendant le combat (non permanents).
// ==========================================

export const ITEMS = {
  '': { id: '', name: 'Aucun', icon: '' },
  collier: { id: 'collier', name: 'Collier rapide', icon: '⚡', bonus: { vit: 0.15 } },
  griffes: { id: 'griffes', name: 'Griffes acérées', icon: '🗡️', bonus: { atk: 0.15 } },
  armure: { id: 'armure', name: 'Armure', icon: '🛡️', bonus: { def: 0.2 } },
  medaille: { id: 'medaille', name: 'Médaille vitale', icon: '❤️', bonus: { maxpv: 0.15 } },
};

// Renvoie une copie des stats avec le bonus d'item appliqué (% arrondi).
export function applyItemBonus(stats, itemId) {
  const item = ITEMS[itemId];
  const out = { ...stats };
  if (item && item.bonus) {
    for (const [stat, pct] of Object.entries(item.bonus)) {
      out[stat] = Math.round((out[stat] || 0) * (1 + pct));
    }
  }
  return out;
}

export function itemLabel(itemId) {
  const item = ITEMS[itemId];
  return item && item.id ? `${item.icon} ${item.name}` : '';
}
