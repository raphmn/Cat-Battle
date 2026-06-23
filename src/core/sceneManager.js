// ==========================================
// Gestionnaire de scènes : affiche une seule "vue" à la fois.
// Chaque scène est un élément DOM enregistré sous un nom.
// navigate('home') affiche home et masque tout le reste.
// Émet un événement 'scene:change' pour permettre aux scènes
// de se rafraîchir au moment où elles deviennent visibles.
// ==========================================

const registry = {};
let current = null;

export function register(name, el, displayType = 'flex') {
  registry[name] = { el, displayType };
}

export function navigate(name) {
  Object.entries(registry).forEach(([n, { el, displayType }]) => {
    el.style.display = n === name ? displayType : 'none';
  });
  current = name;
  window.dispatchEvent(new CustomEvent('scene:change', { detail: name }));
}

export function getCurrent() {
  return current;
}
