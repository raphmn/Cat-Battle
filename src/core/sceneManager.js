// ==========================================
// Gestionnaire de scènes : affiche une seule "vue" à la fois.
// Chaque scène est un élément DOM enregistré sous un nom.
// navigate('home') affiche home et masque tout le reste.
// Émet un événement 'scene:change' pour permettre aux scènes
// de se rafraîchir au moment où elles deviennent visibles.
// ==========================================

const registry = {};

// Enregistre une scène (élément DOM) sous un nom, avec son mode d'affichage.
export function register(name, el, displayType = 'flex') {
  registry[name] = { el, displayType };
}

// Affiche la scène demandée, masque toutes les autres, et notifie via
// 'scene:change' pour que la scène puisse se rafraîchir à l'affichage.
export function navigate(name) {
  Object.entries(registry).forEach(([n, { el, displayType }]) => {
    el.style.display = n === name ? displayType : 'none';
  });
  window.dispatchEvent(new CustomEvent('scene:change', { detail: name }));
}
