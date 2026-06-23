// ==========================================
// Génération ALÉATOIRE des niveaux de combat.
// La difficulté monte progressivement : le niveau 1 est faible,
// le dernier est un BOSS. Chaque niveau est généré à partir d'une
// graine stable (basée sur son id) => même boss à chaque visite.
// ==========================================

import { mulberry32, randInt, pick } from '../core/rng.js';

export const TOTAL_LEVELS = 10;

const ENEMY_NAMES = [
  'Minou Errant', 'Félix le Vif', 'Moustache', 'Gros Matou', 'Bandit',
  'Crocs', 'Tigrou', 'Néko', "Ombre Furtive", 'Patte de Velours',
  'Ronron Sauvage', 'Vagabond',
];

const BOSS_NAMES = ['Roi Griffe', 'Empereur Moustache', 'Léon le Terrible', 'Dame Crocs'];
const TYPES = ['Base', 'Domestique', 'Sauvage'];
const SPRITES = ['🐱', '🐈', '🐈‍⬛', '😼', '😾', '🐯', '🦁'];

// Génère le niveau correspondant à un id donné (1..TOTAL_LEVELS).
export function generateLevel(id) {
  const rng = mulberry32(id * 2654435761); // graine stable par niveau
  const isBoss = id === TOTAL_LEVELS;
  const d = id; // facteur de difficulté

  const displayLevel = Math.round(3 + (id - 1) * (isBoss ? 4 : 2.4));

  const stats = {
    pv: Math.round(50 + d * 15 + randInt(rng, -5, 10)),
    attack: Math.round(8 + d * 3 + randInt(rng, -2, 3)),
    defense: Math.round(4 + d * 2 + randInt(rng, -1, 2)),
    speed: Math.round(8 + d * 1.5 + randInt(rng, -2, 3)),
    crit: Math.round(5 + d * 1.2 + randInt(rng, -1, 2)),
  };

  if (isBoss) {
    stats.pv = Math.round(stats.pv * 1.6);
    stats.attack = Math.round(stats.attack * 1.3);
    stats.defense = Math.round(stats.defense * 1.3);
  }

  const enemyName = isBoss ? pick(rng, BOSS_NAMES) : pick(rng, ENEMY_NAMES);
  const sprite = pick(rng, SPRITES);
  const type = pick(rng, TYPES);

  // Récompense permanente accordée au chat vainqueur, qui grandit avec la difficulté.
  const reward = {
    attack: 2 + Math.floor(d / 3),
    pv: 5 + d,
  };
  if (isBoss) {
    reward.crit = 3;
    reward.defense = 2;
  } else if (d % 2 === 0) {
    reward.speed = 2;
  }

  return {
    id,
    name: isBoss ? `Antre du Boss` : `Niveau ${id}`,
    isBoss,
    enemy: { name: enemyName, type, level: displayLevel, sprite, ...stats },
    reward,
  };
}

export function getAllLevels() {
  return Array.from({ length: TOTAL_LEVELS }, (_, i) => generateLevel(i + 1));
}
