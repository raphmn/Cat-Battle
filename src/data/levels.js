// ==========================================
// Niveaux de bot (CdC US07) : 3 difficultés aux stats croissantes.
// À chaque combat un bot est généré ALÉATOIREMENT pour le niveau choisi
// (US04) : nom + asset + type aléatoires, stats basées sur le niveau.
// ==========================================

const NAMES = ['Minou', 'Bandit', 'Crocs', 'Tigrou', 'Moustache', 'Ombre', 'Néko', 'Félix', 'Patou'];
const ASSETS = ['🐱', '🐈', '🐈‍⬛', '😼', '😾', '🐯', '🦁'];
const TYPES = ['domestique', 'base', 'sauvage'];

export const BOT_LEVELS = [
  { level: 1, label: 'Facile', base: { maxpv: 60, atk: 14, def: 6, vit: 10 }, jitter: 3 },
  { level: 2, label: 'Moyen', base: { maxpv: 95, atk: 22, def: 12, vit: 16 }, jitter: 4 },
  { level: 3, label: 'Difficile', base: { maxpv: 135, atk: 32, def: 18, vit: 24 }, jitter: 5 },
];

const pickRand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const jitter = (v, j) => v + Math.round((Math.random() * 2 - 1) * j);

export function getBotLevel(level) {
  return BOT_LEVELS.find((b) => b.level === level) || BOT_LEVELS[0];
}

// Génère un bot aléatoire pour un niveau donné.
export function generateBot(level) {
  const cfg = getBotLevel(level);
  return {
    name: pickRand(NAMES),
    asset: pickRand(ASSETS),
    type: pickRand(TYPES),
    lvl: level,
    maxpv: Math.max(20, jitter(cfg.base.maxpv, cfg.jitter * 2)),
    atk: Math.max(5, jitter(cfg.base.atk, cfg.jitter)),
    def: Math.max(1, jitter(cfg.base.def, cfg.jitter)),
    vit: Math.max(3, jitter(cfg.base.vit, cfg.jitter)),
  };
}
