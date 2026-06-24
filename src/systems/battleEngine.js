// ==========================================
// Moteur de combat tour par tour (CdC §5.3). Gère l'ÉTAT, pas le DOM.
// La scène appelle playRound() et reçoit une liste d'ÉVÉNEMENTS à jouer.
//
// Règles :
// - Ordre d'action déterminé par VIT (le plus rapide joue en premier).
// - Dégâts : (atk × [0.45..0.95] − def × 0.30) × multiplicateur d'action.
// - Critique : probabilité = vit / 350 → ×1.6 sur les dégâts.
// - ABRI : bloque 100% des dégâts du tour (prioritaire).
// - COUP SPÉCIAL : ×1.55 de dégâts, ~22% de raté.
// - ABRI et COUP SPÉCIAL : interdits deux tours de suite (noConsecutive).
// ==========================================

import { ACTIONS } from '../data/attacks.js';

const rand = (a, b) => a + Math.random() * (b - a);

function makeCombatant(stat, name, asset, lvl) {
  return {
    name,
    asset: asset || '🐱',
    lvl,
    maxpv: stat.maxpv,
    hp: stat.maxpv,
    atk: stat.atk,
    def: stat.def,
    vit: stat.vit,
    shielded: false, // ABRI actif ce tour
    cooldowns: {}, // actionId -> tours restants avant réutilisation
  };
}

export class Battle {
  constructor(playerCat, bot) {
    this.player = makeCombatant(playerCat, playerCat.name, playerCat.asset, playerCat.lvl || 1);
    this.enemy = makeCombatant(bot, bot.name, bot.asset, bot.lvl);
    this.turn = 0;
    this.over = false;
    this.result = null; // 'win' | 'lose'
  }

  isAvailable(side, actionId) {
    return !this[side].cooldowns[actionId];
  }

  critChance(c) {
    return c.vit / 350;
  }

  computeDamage(attacker, defender, action) {
    if (action.missChance && Math.random() < action.missChance) {
      return { miss: true, dmg: 0, crit: false };
    }
    if (defender.shielded) {
      return { blocked: true, dmg: 0, crit: false };
    }
    let dmg = (attacker.atk * rand(0.65, 1.15) - defender.def * 0.2) * (action.mult || 1);
    let crit = false;
    if (Math.random() < this.critChance(attacker)) {
      dmg *= 1.6;
      crit = true;
    }
    return { dmg: Math.max(1, Math.round(dmg)), crit };
  }

  performAction(actorSide, actionId) {
    const actor = this[actorSide];
    const targetSide = actorSide === 'player' ? 'enemy' : 'player';
    const target = this[targetSide];
    const action = ACTIONS[actionId];
    const events = [];

    // On lève sa propre garde au début de sa propre action.
    actor.shielded = false;

    if (action.type === 'shield') {
      actor.shielded = true;
      events.push({ type: 'message', text: `${actor.name} se met à l'ABRI !` });
    } else {
      const res = this.computeDamage(actor, target, action);
      events.push({ type: 'attack', actorSide, actionId, text: `${actor.name} utilise ${action.label} !` });
      if (res.miss) {
        events.push({ type: 'message', text: 'Raté !' });
      } else if (res.blocked) {
        events.push({ type: 'message', text: `${target.name} est à l'abri : aucun dégât !` });
      } else {
        target.hp = Math.max(0, target.hp - res.dmg);
        if (res.crit) events.push({ type: 'message', text: 'Coup critique !' });
        events.push({ type: 'damage', targetSide, dmg: res.dmg });
        if (target.hp <= 0) {
          events.push({ type: 'faint', side: targetSide, text: `${target.name} est K.O. !` });
        }
      }
    }

    // Verrou "pas 2 tours de suite" : indisponible au tour suivant.
    if (action.noConsecutive) actor.cooldowns[actionId] = 2;
    return events;
  }

  tickCooldowns(c) {
    for (const k of Object.keys(c.cooldowns)) {
      c.cooldowns[k] -= 1;
      if (c.cooldowns[k] <= 0) delete c.cooldowns[k];
    }
  }

  // IA bot : varie ses actions, se protège quand il est bas.
  chooseEnemyAction() {
    const e = this.enemy;
    const canSpecial = this.isAvailable('enemy', 'special');
    const canAbri = this.isAvailable('enemy', 'abri');
    const r = Math.random();
    if (canAbri && e.hp < e.maxpv * 0.3 && r < 0.4) return 'abri';
    if (canSpecial && r < 0.3) return 'special';
    if (canAbri && r < 0.45) return 'abri';
    return 'griffer';
  }

  // ABRI est prioritaire (sinon on subirait des dégâts avant de se protéger),
  // sinon l'ordre suit la VIT.
  resolveOrder(playerActionId, enemyActionId) {
    const pShield = ACTIONS[playerActionId].type === 'shield';
    const eShield = ACTIONS[enemyActionId].type === 'shield';
    if (pShield && !eShield) return ['player', 'enemy'];
    if (eShield && !pShield) return ['enemy', 'player'];
    return this.player.vit >= this.enemy.vit ? ['player', 'enemy'] : ['enemy', 'player'];
  }

  playRound(playerActionId) {
    const events = [];
    const enemyActionId = this.chooseEnemyAction();
    const acts = { player: playerActionId, enemy: enemyActionId };

    // ABRI bloque uniquement pendant le tour en cours.
    this.player.shielded = false;
    this.enemy.shielded = false;

    for (const side of this.resolveOrder(playerActionId, enemyActionId)) {
      if (this[side].hp <= 0) continue;
      events.push(...this.performAction(side, acts[side]));
      const otherSide = side === 'player' ? 'enemy' : 'player';
      if (this[otherSide].hp <= 0) break;
    }

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
    return events;
  }
}
