// ==========================================
// Scène de Combat (style Pokémon, CdC §3.2/§3.3).
// Haut : terrain + barres de vie ennemi/joueur.
// Bas : boîte de message + 4 boutons (GRIFFER / COUP SPÉCIAL / ABRI / FUIR).
// ==========================================

import { register, navigate } from '../core/sceneManager.js';
import { Battle } from '../systems/battleEngine.js';
import { ACTIONS } from '../data/attacks.js';
import { generateBot, generateRandomBot } from '../data/levels.js';
import { getCats, saveCats, addHistoryEntry } from '../core/storage.js';
import { playSfx, playTrack, sfxHit, sfxSpecial, sfxFaint } from '../core/audio.js';
import { applyItemBonus } from '../data/items.js';
import { setAssetEl } from '../core/asset.js';

// Fonds de combat pixel-art (jour/nuit, plusieurs biomes), choisis au hasard.
const BATTLE_BGS = [
  'beach', 'beach-2', 'beach-night',
  'desert', 'desert-night',
  'mountain', 'mountain-2', 'mountain-night',
  'path', 'path-2', 'path-night',
  'snow', 'snow-night',
  'tall-grass', 'tall-grass-night',
];

const STAT_LABELS = { maxpv: 'PV', atk: 'ATK', def: 'DEF', vit: 'VIT' };
const SKILLS = ['atk', 'def', 'vit']; // compétences gagnées après victoire
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let root, els;
let battle = null;
let ctx = null; // { botLevel, catIndex }
let busy = false;

export function initBattle() {
  root = document.createElement('div');
  root.id = 'scene-battle';
  root.className = 'scene battle-scene';
  root.style.display = 'none';
  root.innerHTML = `
    <div class="battle-field">
      <div class="hud hud-enemy">
        <div class="hud-name"><span class="bname"></span><span class="blevel"></span></div>
        <div class="hud-hpwrap"><span class="hp-tag">PV</span><div class="hp-bar"><div class="hp-fill"></div></div></div>
      </div>
      <div class="platform platform-enemy"></div>
      <div class="sprite sprite-enemy"></div>
      <div class="platform platform-player"></div>
      <div class="sprite sprite-player"></div>
      <div class="hud hud-player">
        <div class="hud-name"><span class="bname"></span><span class="blevel"></span></div>
        <div class="hud-hpwrap"><span class="hp-tag">PV</span><div class="hp-bar"><div class="hp-fill"></div></div></div>
        <div class="hp-num"></div>
        <div class="hud-xpwrap"><span class="xp-tag">NIV</span><div class="xp-bar"><div class="xp-fill"></div></div></div>
      </div>
    </div>
    <div class="battle-ui">
      <div class="battle-message retro-box"><p class="msg-text"></p></div>
      <div class="battle-actions">
        <button class="bttn-action" data-act="griffer"></button>
        <button class="bttn-action" data-act="special"></button>
        <button class="bttn-action" data-act="abri"></button>
        <button class="bttn-action" data-act="flee">FUIR</button>
      </div>
    </div>
    <div class="battle-result" style="display:none">
      <div class="result-card retro-box">
        <p class="result-title"></p>
        <p class="result-detail"></p>
        <button class="result-btn retro-button">Continuer</button>
      </div>
    </div>
  `;
  document.getElementById('game-container').appendChild(root);
  register('battle', root, 'flex');

  // Précharge les fonds pour éviter le gros chargement au lancement d'un combat.
  BATTLE_BGS.forEach((bg) => {
    const img = new Image();
    img.src = `/sprites/battle-bg/${bg}.png`;
  });

  els = {
    enemyName: root.querySelector('.hud-enemy .bname'),
    enemyLevel: root.querySelector('.hud-enemy .blevel'),
    enemyHp: root.querySelector('.hud-enemy .hp-fill'),
    enemySprite: root.querySelector('.sprite-enemy'),
    playerName: root.querySelector('.hud-player .bname'),
    playerLevel: root.querySelector('.hud-player .blevel'),
    playerHp: root.querySelector('.hud-player .hp-fill'),
    playerHpNum: root.querySelector('.hud-player .hp-num'),
    playerXp: root.querySelector('.hud-player .xp-fill'),
    playerSprite: root.querySelector('.sprite-player'),
    msg: root.querySelector('.msg-text'),
    actions: root.querySelector('.battle-actions'),
    actionBtns: [...root.querySelectorAll('.bttn-action')],
    field: root.querySelector('.battle-field'),
    result: root.querySelector('.battle-result'),
    resultTitle: root.querySelector('.result-title'),
    resultDetail: root.querySelector('.result-detail'),
    resultBtn: root.querySelector('.result-btn'),
  };

  els.actions.addEventListener('click', onActionClick);
  els.resultBtn.addEventListener('click', () => {
    els.result.style.display = 'none';
    playTrack('menu');
    navigate(returnScene());
  });
}

// Scène de retour après le combat : home en mode aléatoire, sinon niveaux.
function returnScene() {
  return ctx && ctx.random ? 'home' : 'levelSelect';
}

export function startBattle(botLevel, catIndex, random = false) {
  const cat = getCats()[catIndex];
  if (!cat) return;

  const bot = random ? generateRandomBot() : generateBot(botLevel);
  ctx = { botLevel, catIndex, random };
  // Bonus d'objet appliqué au combat (non permanent).
  // Backward compatible: support cat.items (nouveau) et cat.item (ancien)
  const itemIds = cat.items || (cat.item ? [cat.item] : []);
  const boosted = {
    ...cat,
    ...applyItemBonus({ maxpv: cat.maxpv, atk: cat.atk, def: cat.def, vit: cat.vit }, itemIds),
  };
  battle = new Battle(boosted, bot);
  busy = false;

  els.enemyName.textContent = battle.enemy.name;
  els.enemyLevel.textContent = 'Niv.' + battle.enemy.lvl;
  setAssetEl(els.enemySprite, battle.enemy.asset);
  els.playerName.textContent = battle.player.name;
  els.playerLevel.textContent = 'Niv.' + battle.player.lvl;
  setAssetEl(els.playerSprite, battle.player.asset);
  setLvlProgress(cat.wins || 0);

  // Fond de combat aléatoire.
  const bg = BATTLE_BGS[Math.floor(Math.random() * BATTLE_BGS.length)];
  els.field.style.backgroundImage = `url('/sprites/battle-bg/${bg}.png')`;
  els.result.style.display = 'none';

  // Réinitialise les classes d'animation + entrée du bot.
  els.enemySprite.className = 'sprite sprite-enemy enter';
  els.playerSprite.className = 'sprite sprite-player';

  updateHud();
  setActionsEnabled(false);
  setMessage(`Un bot ${battle.enemy.name} (Niv.${battle.enemy.lvl}) apparaît !`);
  playTrack('battle');
  navigate('battle');
  setTimeout(promptPlayer, 1000);
}

function setMessage(t) {
  els.msg.textContent = t;
}

function setBar(el, hp, max) {
  const r = Math.max(0, hp / max);
  el.style.width = r * 100 + '%';
  el.style.background = r > 0.5 ? '#70c860' : r > 0.2 ? '#f0b000' : '#f04040';
}

function updateHud() {
  setBar(els.enemyHp, battle.enemy.hp, battle.enemy.maxpv);
  setBar(els.playerHp, battle.player.hp, battle.player.maxpv);
  els.playerHpNum.textContent = `${battle.player.hp}/${battle.player.maxpv}`;
}

// Progression vers le niveau suivant : 3 victoires = 1 niveau.
function setLvlProgress(wins) {
  const step = (wins || 0) % 3;
  els.playerXp.style.width = (step / 3) * 100 + '%';
}

function setActionsEnabled(on) {
  els.actions.classList.toggle('locked', !on);
}

function getDamageRange(attacker, defender, action) {
  if (!attacker || !defender || action.type !== 'damage') return null;
  const minBase = attacker.atk * 0.65 - defender.def * 0.2;
  const maxBase = attacker.atk * 1.15 - defender.def * 0.2;
  const minDmg = Math.max(1, Math.round(minBase * (action.mult || 1)));
  const maxDmg = Math.max(1, Math.round(maxBase * (action.mult || 1)));
  return [minDmg, maxDmg];
}

function setButtonContent(btn, titleText, descText) {
  const act = btn.dataset.act;
  btn.innerHTML = '';
  if (act) btn.dataset.act = act;
  const titleEl = document.createElement('span');
  titleEl.className = 'action-label';
  titleEl.textContent = titleText;
  const descEl = document.createElement('span');
  descEl.className = 'action-desc';
  descEl.textContent = descText;
  btn.append(titleEl, descEl);
}

function promptPlayer() {
  setMessage(`Que fait ${battle.player.name} ?`);
  els.actionBtns.forEach((btn) => {
    const act = btn.dataset.act;
    if (act === 'flee') {
      setButtonContent(btn, 'Quitter le combat', 'Retour au menu');
      btn.disabled = false;
      return;
    }

    const action = ACTIONS[act];
    const titleText = action.label;
    let descText = action.description || '';
    const range = getDamageRange(battle.player, battle.enemy, action);
    if (range) {
      const [minDmg, maxDmg] = range;
      descText = minDmg === maxDmg ? `${minDmg} dégâts` : `${minDmg}-${maxDmg} dégâts`;
      if (action.missChance) descText += ' · raté possible';
      if (action.selfCost) descText += ` · -${action.selfCost} PV`;
    }

    const cd = battle.player.cooldowns[act];
    if (cd) {
      setButtonContent(btn, titleText, `CD ${cd}`);
      btn.disabled = true;
    } else {
      setButtonContent(btn, titleText, descText);
      btn.disabled = false;
    }
  });
  setActionsEnabled(true);
}

function onActionClick(e) {
  const btn = e.target.closest('.bttn-action');
  if (!btn || busy || btn.disabled || els.actions.classList.contains('locked')) return;
  const act = btn.dataset.act;
  playSfx();

  if (act === 'flee') return handleFlee();

  busy = true;
  setActionsEnabled(false);
  playEvents(battle.playRound(act)).then(afterRound);
}

// FUIR : fin de combat immédiate, sans victoire ni défaite (CdC §3.3).
function handleFlee() {
  busy = true;
  setActionsEnabled(false);
  setMessage('Vous prenez la fuite !');
  setTimeout(() => {
    playTrack('menu');
    navigate(returnScene());
  }, 1100);
}

async function playEvents(events) {
  for (const ev of events) {
    if (ev.type === 'attack') {
      setMessage(ev.text);
      lunge(ev.actorSide);
      showCenterFx('attack');
      if (ev.actionId === 'special') {
        showCenterFx('special');
        sfxSpecial();
      }
      await wait(900);
    } else if (ev.type === 'shield') {
      setMessage(ev.text);
      showCenterFx('shield');
      await wait(900);
    } else if (ev.type === 'faint') {
      setMessage(ev.text);
      faint(ev.side);
      sfxFaint();
      await wait(900);
    } else if (ev.type === 'message') {
      setMessage(ev.text);
      await wait(900);
    } else if (ev.type === 'damage') {
      shake(ev.targetSide);
      showDamage(ev.targetSide, ev.dmg);
      sfxHit();
      // On ne baisse que la barre de la cible (sinon les 2 chutent ensemble).
      const bar = ev.targetSide === 'player' ? els.playerHp : els.enemyHp;
      setBar(bar, ev.hp, ev.maxpv);
      if (ev.targetSide === 'player') els.playerHpNum.textContent = `${ev.hp}/${ev.maxpv}`;
      await wait(550);
    }
  }
}

function afterRound() {
  busy = false;
  if (battle.over) return endBattle();
  promptPlayer();
}

function showDamage(side, dmg) {
  const field = root.querySelector('.battle-field');
  const pop = document.createElement('div');
  pop.className = `dmg-float dmg-${side}`;
  pop.textContent = `-${dmg} PV`;
  field.appendChild(pop);
  setTimeout(() => pop.remove(), 900);
}

function shieldMarkup() {
  return '<div class="fx-shield">🛡️</div>';
}

// Coup spécial : double onde de choc + éclat central.
function specialMarkup() {
  return `
    <div class="fx-special">
      <span class="fx-ring"></span>
      <span class="fx-ring fx-ring2"></span>
      <span class="fx-burst">💥</span>
      <span class="fx-spark fx-spark1">✦</span>
      <span class="fx-spark fx-spark2">✦</span>
      <span class="fx-spark fx-spark3">✦</span>
      <span class="fx-spark fx-spark4">✦</span>
    </div>`;
}

// Vraies marques de griffe : 4 lacérations effilées en SVG.
function clawMarkup() {
  return `
    <svg class="claw-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="clawgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="55%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#ff4040"/>
        </linearGradient>
      </defs>
      <g class="claw-g" transform="rotate(-22 100 100)">
        <path d="M55,25 C62,71 62,133 55,180 C48,133 48,71 55,25 Z"/>
        <path d="M90,15 C98,67 98,137 90,190 C82,137 82,67 90,15 Z"/>
        <path d="M125,20 C133,69 133,135 125,185 C117,135 117,69 125,20 Z"/>
        <path d="M160,30 C166,73 166,131 160,175 C154,131 154,73 160,30 Z"/>
      </g>
    </svg>`;
}

// Effet central animé : marques de griffe (attaque) ou bouclier (abri).
function showCenterFx(kind) {
  const field = root.querySelector('.battle-field');
  const fx = document.createElement('div');
  fx.className = `center-fx fx-${kind}`;
  fx.innerHTML =
    kind === 'shield' ? shieldMarkup() : kind === 'special' ? specialMarkup() : clawMarkup();
  field.appendChild(fx);
  setTimeout(() => fx.remove(), 700);
}

function shake(side) {
  const el = side === 'player' ? els.playerSprite : els.enemySprite;
  el.classList.add('hit');
  setTimeout(() => el.classList.remove('hit'), 300);
}

function lunge(side) {
  const el = side === 'player' ? els.playerSprite : els.enemySprite;
  el.classList.add('lunge');
  setTimeout(() => el.classList.remove('lunge'), 400);
}

function faint(side) {
  const el = side === 'player' ? els.playerSprite : els.enemySprite;
  el.classList.add('faint');
}

function endBattle() {
  setActionsEnabled(false);
  const won = battle.result === 'win';
  addHistoryEntry({
    result: won ? 'win' : 'lose',
    opponent: battle.enemy.name,
    level: ctx.botLevel,
    catName: battle.player.name,
    ts: Date.now(),
  });
  if (won) return applyVictory();
  showResult('Défaite...', `${battle.player.name} est K.O.`, false);
}

// Progression (CdC US08) : +1 compétence aléatoire par victoire,
// montée de niveau tous les 3 combats gagnés.
function applyVictory() {
  const cats = getCats();
  const cat = cats[ctx.catIndex];
  const gained = [];

  if (cat) {
    const enemyLvl = battle.enemy.lvl;

    // Plus le niveau de l'adversaire est élevé, plus on gagne de compétences (US08).
    const points = Math.max(1, Math.ceil(enemyLvl / 3));
    const inc = {};
    for (let i = 0; i < points; i++) {
      const stat = SKILLS[Math.floor(Math.random() * SKILLS.length)];
      cat[stat] = (cat[stat] || 0) + 1;
      inc[stat] = (inc[stat] || 0) + 1;
    }
    cat.wins = (cat.wins || 0) + 1;
    for (const stat of SKILLS) {
      if (inc[stat]) gained.push(`${STAT_LABELS[stat]} +${inc[stat]}`);
    }

    // Montée de niveau toutes les 3 victoires.
    cat.lvl = cat.lvl || 1;
    let leveled = false;
    if (cat.wins % 3 === 0) {
      cat.lvl += 1;
      cat.maxpv += 10;
      leveled = true;
      gained.push('PV max +10');
    }

    saveCats(cats);
    setLvlProgress(cat.wins, cat.lvl);

    const lvlMsg = leveled ? ` — passe Niv.${cat.lvl} !` : '';
    showResult('Victoire !', `${cat.name} : ${gained.join('   ')}${lvlMsg}`, true);
  } else {
    showResult('Victoire !', '', true);
  }
}

function showResult(title, detail, win) {
  els.resultTitle.textContent = title;
  els.resultTitle.style.color = win ? '#2a8a4a' : '#c33';
  els.resultDetail.textContent = detail;
  els.result.style.display = 'flex';
}
