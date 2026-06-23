// ==========================================
// Moteur de combat tour par tour (style Pokémon).
// La classe Battle gère l'ÉTAT ; elle ne touche pas au DOM.
// La scène de combat appelle playRound()/enemyFreeTurn() et reçoit
// une liste d'ÉVÉNEMENTS qu'elle joue ensuite avec des animations.
// ==========================================

import { ACTIONS, DEFEND_REDUCTION } from '../data/attacks.js';

const DEFENSE_CAP = 60; // réduction max via la stat défense (%)
const variance = () => 0.85 + Math.random() * 0.15;

function makeCombatant(stat, name, sprite, level) {
  return {
    name,
    sprite,
    level,
    maxHp: stat.pv,
    hp: stat.pv,
    attack: stat.attack,
    defense: stat.defense,
    speed: stat.speed,
    crit: stat.crit,
    cooldowns: {}, // actionId -> tours restants
    defending: false,
  };
}

export class Battle {
  constructor(playerCat, level) {
    this.player = makeCombatant(
      playerCat,
      playerCat.name,
      playerCat.sprite || '🐱',
      playerCat.level || 5
    );
    this.enemy = makeCombatant(
      level.enemy,
      level.enemy.name,
      level.enemy.sprite || '🐈',
      level.enemy.level
    );
    this.level = level;
    this.turn = 0;
    this.over = false;
    this.result = null; // 'win' | 'lose'
  }

  isAvailable(side, actionId) {
    return !this[side].cooldowns[actionId];
  }

  computeDamage(attacker, defender, action) {
    let dmg = attacker.attack * (action.multiplier || 1) * variance();
    const defReduction = Math.min(defender.defense, DEFENSE_CAP) / 100;
    dmg *= 1 - defReduction;

    let crit = false;
    const critChance = (attacker.crit || 0) + (action.critBonus || 0);
    if (Math.random() * 100 < critChance) {
      dmg *= 1.5;
      crit = true;
    }
    if (defender.defending) dmg *= DEFEND_REDUCTION;

    return { dmg: Math.max(1, Math.round(dmg)), crit };
  }

  // Exécute l'action d'un combattant et renvoie les événements produits.
  performAction(actorSide, actionId) {
    const actor = this[actorSide];
    const targetSide = actorSide === 'player' ? 'enemy' : 'player';
    const target = this[targetSide];
    const action = ACTIONS[actionId];
    const events = [];

    // On lève sa propre garde au moment d'agir.
    actor.defending = false;

    if (action.type === 'defend') {
      actor.defending = true;
      events.push({ type: 'message', text: `${actor.name} se met en garde !` });
    } else {
      const { dmg, crit } = this.computeDamage(actor, target, action);
      target.hp = Math.max(0, target.hp - dmg);
      events.push({ type: 'attack', actorSide, text: `${actor.name} utilise ${action.label} !` });
      if (crit) events.push({ type: 'message', text: 'Coup critique !' });
      events.push({ type: 'damage', targetSide, dmg });
      if (target.hp <= 0) {
        events.push({ type: 'faint', side: targetSide, text: `${target.name} est K.O. !` });
      }
    }

    if (action.cooldown > 0) actor.cooldowns[actionId] = action.cooldown;
    return events;
  }

  tickCooldowns(c) {
    for (const k of Object.keys(c.cooldowns)) {
      c.cooldowns[k] -= 1;
      if (c.cooldowns[k] <= 0) delete c.cooldowns[k];
    }
  }

  // IA ennemie simple.
  chooseEnemyAction() {
    const e = this.enemy;
    const canSpecial = this.isAvailable('enemy', 'special');
    const r = Math.random();
    if (e.hp < e.maxHp * 0.25 && r < 0.3) return 'defense';
    if (canSpecial && r < 0.45) return 'special';
    if (r < 0.15) return 'defense';
    return 'attack';
  }

  // Un tour complet : action joueur + action ennemie, ordonnées par vitesse.
  playRound(playerActionId) {
    const events = [];
    const enemyActionId = this.chooseEnemyAction();
    const playerFirst = this.player.speed >= this.enemy.speed;
    const order = playerFirst
      ? [['player', playerActionId], ['enemy', enemyActionId]]
      : [['enemy', enemyActionId], ['player', playerActionId]];

    for (const [side, actId] of order) {
      if (this[side].hp <= 0) continue;
      events.push(...this.performAction(side, actId));
      const otherSide = side === 'player' ? 'enemy' : 'player';
      if (this[otherSide].hp <= 0) break;
    }

    this.endRound();
    return events;
  }

  // Tour offert à l'ennemi (ex : échec de fuite).
  enemyFreeTurn() {
    const events = [];
    if (this.enemy.hp > 0) {
      events.push(...this.performAction('enemy', this.chooseEnemyAction()));
    }
    this.endRound();
    return events;
  }

  endRound() {
    this.tickCooldowns(this.player);
    this.tickCooldowns(this.enemy);
    this.turn++;
    if (this.enemy.hp <= 0) {
      this.over = true;
      this.result = 'win';
    } else if (this.player.hp <= 0) {
      this.over = true;
      this.result = 'lose';
    }
  }

  // Tentative de fuite : dépend du rapport de vitesse.
  tryFlee() {
    const chance = 0.4 + 0.5 * (this.player.speed / (this.enemy.speed + 1));
    return Math.random() < Math.min(0.95, chance);
  }
}
