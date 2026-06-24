// ==========================================
// Niveaux de bot : difficulté croissante. À chaque combat un bot est
// généré ALÉATOIREMENT pour le niveau choisi (US04) : nom + asset + type
// aléatoires, stats basées sur le niveau (US07).
// Les niveaux sont regroupés en 3 bandes : Facile / Moyen / Difficile.
// ==========================================

const NAMES = ['Minou', 'Bandit', 'Crocs', 'Tigrou', 'Moustache', 'Ombre', 'Néko', 'Félix', 'Patou', 'Roux', 'Zorro'];
const ASSETS = ['🐱', '🐈', '🐈‍⬛', '😼', '😾', '🐯', '🦁'];
const TYPES = ['domestique', 'base', 'sauvage'];

export const TOTAL_LEVELS = 9;

function bandLabel(level) {
  if (level <= 3) return 'Facile';
  if (level <= 6) return 'Moyen';
  return 'Difficile';
}

function makeLevelConfig(level) {
  return {
    level,
    label: bandLabel(level),
    base: {
      maxpv: 45 + level * 13,
      atk: 9 + level * 3,
      def: 3 + level * 2,
      vit: 7 + level * 2,
    },
    jitter: 2 + Math.floor(level / 3),
  };
}

export const BOT_LEVELS = Array.from({ length: TOTAL_LEVELS }, (_, i) => makeLevelConfig(i + 1));

const pickRand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const jitter = (v, j) => v + Math.round((Math.random() * 2 - 1) * j);

export function getBotLevel(level) {
  return BOT_LEVELS.find((b) => b.level === level) || BOT_LEVELS[0];
}

// Mode "full aléatoire" : stats tirées au hasard sur toute la plage,
// sans rapport avec les niveaux de campagne.
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

export function generateRandomBot() {
  return {
    name: pickRand(NAMES),
    asset: pickRand(ASSETS),
    type: pickRand(TYPES),
    lvl: randInt(1, TOTAL_LEVELS),
    maxpv: randInt(40, 180),
    atk: randInt(8, 40),
    def: randInt(2, 25),
    vit: randInt(5, 28),
  };
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
