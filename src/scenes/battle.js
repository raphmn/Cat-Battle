// ==========================================
// Scène de Combat (style Pokémon).
// Haut : terrain + barres de vie ennemi/joueur.
// Bas : boîte de message + 4 boutons (3 actions + Fuir).
// Le moteur (Battle) gère la logique ; ici on joue les animations.
// ==========================================

import { register, navigate } from '../core/sceneManager.js';
import { Battle } from '../systems/battleEngine.js';
import { ACTIONS } from '../data/attacks.js';
import { getCats, saveCats, unlockLevel } from '../core/storage.js';
import { playSfx, playTrack } from '../core/audio.js';
import { TOTAL_LEVELS } from '../data/levels.js';

const STAT_LABELS = { pv: 'PV', attack: 'ATQ', defense: 'DEF', speed: 'VIT', crit: 'CRIT' };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let root, els;
let battle = null;
let ctx = null; // { level, catIndex }
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
        <button class="bttn-action" data-act="attack"></button>
        <button class="bttn-action" data-act="defense"></button>
        <button class="bttn-action" data-act="special"></button>
        <button class="bttn-action" data-act="flee">Fuir</button>
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

export function startBattle(level, catIndex) {
  const cat = getCats()[catIndex];
  if (!cat) return;

  ctx = { level, catIndex };
  battle = new Battle(cat, level);
  busy = false;

  els.enemyName.textContent = battle.enemy.name;
  els.enemyLevel.textContent = 'Niv.' + battle.enemy.level;
  els.enemySprite.textContent = battle.enemy.sprite;
  els.playerName.textContent = battle.player.name;
  els.playerLevel.textContent = 'Niv.' + battle.player.level;
  els.playerSprite.textContent = battle.player.sprite;
  els.result.style.display = 'none';

  updateHud();
  setActionsEnabled(false);
  setMessage(`Un ${battle.enemy.name} sauvage apparaît !`);
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
  setBar(els.enemyHp, battle.enemy.hp, battle.enemy.maxHp);
  setBar(els.playerHp, battle.player.hp, battle.player.maxHp);
  els.playerHpNum.textContent = `${battle.player.hp}/${battle.player.maxHp}`;
}

function setActionsEnabled(on) {
  els.actions.classList.toggle('locked', !on);
}

function promptPlayer() {
  setMessage(`Que fait ${battle.player.name} ?`);
  els.actionBtns.forEach((btn) => {
    const act = btn.dataset.act;
    if (act === 'flee') return;
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

function handleFlee() {
  busy = true;
  setActionsEnabled(false);
  if (battle.tryFlee()) {
    setMessage('Vous prenez la fuite !');
    setTimeout(() => {
      playTrack('menu');
      navigate('levelSelect');
    }, 1200);
  } else {
    setMessage('Fuite impossible !');
    setTimeout(() => playEvents(battle.enemyFreeTurn()).then(afterRound), 900);
  }
}

async function playEvents(events) {
  for (const ev of events) {
    if (ev.type === 'attack' || ev.type === 'message' || ev.type === 'faint') {
      setMessage(ev.text);
      await wait(900);
    } else if (ev.type === 'damage') {
      shake(ev.targetSide);
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

function shake(side) {
  const el = side === 'player' ? els.playerSprite : els.enemySprite;
  el.classList.add('hit');
  setTimeout(() => el.classList.remove('hit'), 300);
}

function endBattle() {
  setActionsEnabled(false);
  if (battle.result === 'win') return applyVictory();
  showResult('Défaite...', `${battle.player.name} est K.O.`, false);
}

function applyVictory() {
  const cats = getCats();
  const cat = cats[ctx.catIndex];
  const gained = [];

  if (cat) {
    const reward = ctx.level.reward || {};
    for (const [k, v] of Object.entries(reward)) {
      cat[k] = (cat[k] || 0) + v;
      gained.push(`${STAT_LABELS[k] || k} +${v}`);
    }
    cat.level = (cat.level || 5) + 1;
    saveCats(cats);
    unlockLevel(Math.min(ctx.level.id + 1, TOTAL_LEVELS));
    showResult('Victoire !', `${cat.name} passe Niv.${cat.level} !\n${gained.join('   ')}`, true);
  } else {
    unlockLevel(Math.min(ctx.level.id + 1, TOTAL_LEVELS));
    showResult('Victoire !', '', true);
  }
}

function showResult(title, detail, win) {
  els.resultTitle.textContent = title;
  els.resultTitle.style.color = win ? '#2a8a4a' : '#c33';
  els.resultDetail.textContent = detail;
  els.result.style.display = 'flex';
}
