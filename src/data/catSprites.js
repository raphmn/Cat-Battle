// ==========================================
// Sprites de chats dessinés en SVG (data URL). Remplacent les emoji :
// utilisés comme tuiles à l'adoption et pour les bots adverses.
// Chaque sprite = un chat assis mignon, décliné par palette de couleur.
// ==========================================

const PALETTES = [
  { id: 'roux', name: 'Roux', fur: '#e8893f', shade: '#c66a23', belly: '#f6dcb8', ear: '#f2b3a0', eye: '#6cc24a', stripes: true },
  { id: 'noir', name: 'Noir', fur: '#41414c', shade: '#2a2a32', belly: '#6a6a78', ear: '#7a5a66', eye: '#f2c14e', stripes: false },
  { id: 'gris', name: 'Gris', fur: '#9aa4af', shade: '#6f7984', belly: '#d9dee3', ear: '#d6a9b4', eye: '#5ab0d6', stripes: true },
  { id: 'blanc', name: 'Blanc', fur: '#f3f1ea', shade: '#c9c5ba', belly: '#ffffff', ear: '#f4c2cf', eye: '#7bb0e0', stripes: false },
  { id: 'tigre', name: 'Tigré', fur: '#b67d44', shade: '#7c5026', belly: '#ecd9b8', ear: '#e0a890', eye: '#8ac24a', stripes: true },
  { id: 'siamois', name: 'Siamois', fur: '#e6dcc6', shade: '#8a6f4e', belly: '#f7f0e0', ear: '#6b4a38', eye: '#4aa6c2', stripes: false },
  { id: 'marron', name: 'Marron', fur: '#8a5a3c', shade: '#5e3a25', belly: '#d8b48c', ear: '#c98f78', eye: '#d2a23a', stripes: true },
  { id: 'bleu', name: 'Bleu russe', fur: '#7f8c9b', shade: '#57636f', belly: '#c2cad2', ear: '#c6a6b0', eye: '#6fc28a', stripes: false },
];

function catSvg(p) {
  const stroke = 'rgba(0,0,0,0.18)';
  const stripes = p.stripes
    ? `<path d="M50 18 v9 M39 21 l3 8 M61 21 l-3 8" stroke="${p.shade}" stroke-width="3" stroke-linecap="round" fill="none"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110">
  <path d="M78 92 q22 -6 14 -30 q-4 -12 -14 -8 q8 6 6 16 q-2 12 -14 14 z" fill="${p.fur}" stroke="${stroke}" stroke-width="1.5"/>
  <path d="M50 52 c-20 0 -32 18 -32 38 c0 8 6 12 14 12 h36 c8 0 14 -4 14 -12 c0 -20 -12 -38 -32 -38 z" fill="${p.fur}" stroke="${stroke}" stroke-width="1.5"/>
  <ellipse cx="50" cy="92" rx="13" ry="15" fill="${p.belly}"/>
  <path d="M28 24 l-6 -20 l20 10 z" fill="${p.fur}" stroke="${stroke}" stroke-width="1.5"/>
  <path d="M72 24 l6 -20 l-20 10 z" fill="${p.fur}" stroke="${stroke}" stroke-width="1.5"/>
  <circle cx="50" cy="40" r="26" fill="${p.fur}" stroke="${stroke}" stroke-width="1.5"/>
  <path d="M30 20 l-3 -10 l11 6 z" fill="${p.ear}"/>
  <path d="M70 20 l3 -10 l-11 6 z" fill="${p.ear}"/>
  ${stripes}
  <ellipse cx="40" cy="41" rx="5" ry="6" fill="#fff"/>
  <ellipse cx="60" cy="41" rx="5" ry="6" fill="#fff"/>
  <circle cx="40" cy="41" r="3.2" fill="${p.eye}"/>
  <circle cx="60" cy="41" r="3.2" fill="${p.eye}"/>
  <circle cx="40" cy="41.5" r="1.6" fill="#222"/>
  <circle cx="60" cy="41.5" r="1.6" fill="#222"/>
  <circle cx="41" cy="39.5" r="1" fill="#fff"/>
  <circle cx="61" cy="39.5" r="1" fill="#fff"/>
  <path d="M47 48 h6 l-3 4 z" fill="#d9788a"/>
  <path d="M50 52 q-4 4 -8 2 M50 52 q4 4 8 2" stroke="${p.shade}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <g stroke="${p.shade}" stroke-width="1.2" stroke-linecap="round">
    <path d="M30 46 l-14 -3 M30 50 l-14 2"/>
    <path d="M70 46 l14 -3 M70 50 l14 2"/>
  </g>
</svg>`;
}

function dataUrl(svg) {
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// [{ id, name, asset(dataURL) }]
export const CAT_SPRITES = PALETTES.map((p) => ({
  id: p.id,
  name: p.name,
  asset: dataUrl(catSvg(p)),
}));

export const CAT_SPRITE_ASSETS = CAT_SPRITES.map((c) => c.asset);
