// ==========================================
// Scène de Combat (style Pokémon, CdC §3.2/§3.3).
// Haut : terrain + barres de vie ennemi/joueur.
// Bas : boîte de message + 4 boutons (GRIFFER / COUP SPÉCIAL / ABRI / FUIR).
// ==========================================

import { register, navigate } from '../core/sceneManager.js';
import { Battle } from '../systems/battleEngine.js';
import { ACTIONS } from '../data/attacks.js';
import { generateBot } from '../data/levels.js';
import { getCats, saveCats, addHistoryEntry } from '../core/storage.js';
import { playSfx, playTrack, sfxHit, sfxSpecial, sfxFaint } from '../core/audio.js';
import { applyItemBonus } from '../data/items.js';
import { mountWebGLBackground } from '../core/webglBackground.js';

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
      <div class="battle-bg-ground"></div>
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
  mountWebGLBackground(root.querySelector('.battle-field')); // repli CSS auto si WebGL absent

  els = {
    enemyName: root.querySelector('.hud-enemy .bname'),
    enemyLevel: root.querySelector('.hud-enemy .blevel'),
    enemyHp: root.querySelector('.hud-enemy .hp-fill'),
    enemySprite: root.querySelector('.sprite-enemy'),
    playerName: root.querySelector('.hud-player .bname'),
    playerLevel: root.querySelector('.hud-player .blevel'),
    playerHp: root.querySelector('.hud-player .hp-fill'),
    playerHpNum: root.querySelector('.hud-player .hp-num'),
    playerSprite: root.querySelector('.sprite-player'),
    msg: root.querySelector('.msg-text'),
    actions: root.querySelector('.battle-actions'),
    actionBtns: [...root.querySelectorAll('.bttn-action')],
    result: root.querySelector('.battle-result'),
    resultTitle: root.querySelector('.result-title'),
    resultDetail: root.querySelector('.result-detail'),
    resultBtn: root.querySelector('.result-btn'),
  };

  els.actions.addEventListener('click', onActionClick);
  els.resultBtn.addEventListener('click', () => {
    els.result.style.display = 'none';
    playTrack('menu');
    navigate('levelSelect');
  });
}

export function startBattle(botLevel, catIndex) {
  const cat = getCats()[catIndex];
  if (!cat) return;

  const bot = generateBot(botLevel);
  ctx = { botLevel, catIndex };
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
  els.enemySprite.textContent = battle.enemy.asset;
  els.playerName.textContent = battle.player.name;
  els.playerLevel.textContent = 'Niv.' + battle.player.lvl;
  els.playerSprite.textContent = battle.player.asset;
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

function setActionsEnabled(on) {
  els.actions.classList.toggle('locked', !on);
}

function promptPlayer() {
  setMessage(`Que fait ${battle.player.name} ?`);
  els.actionBtns.forEach((btn) => {
    const act = btn.dataset.act;
    if (act === 'flee') {
      btn.textContent = 'FUIR';
      return;
    }
    const cd = battle.player.cooldowns[act];
    if (cd) {
      btn.textContent = `${ACTIONS[act].label} (${cd})`;
      btn.disabled = true;
    } else {
      btn.textContent = ACTIONS[act].label;
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
    navigate('levelSelect');
  }, 1100);
}

async function playEvents(events) {
  for (const ev of events) {
    if (ev.type === 'attack') {
      setMessage(ev.text);
      lunge(ev.actorSide);
      if (ev.actionId === 'special') sfxSpecial();
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
      updateHud();
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
    // Plus le niveau du bot est élevé, plus on gagne de compétences (US08).
    const points = Math.ceil(ctx.botLevel / 3); // 1 Facile, 2 Moyen, 3 Difficile
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

    let leveled = false;
    if (cat.wins % 3 === 0) {
      cat.lvl = (cat.lvl || 1) + 1;
      cat.maxpv += 10;
      leveled = true;
      gained.push('PV max +10');
    }
    saveCats(cats);

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
