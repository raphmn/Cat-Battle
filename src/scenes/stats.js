// ==========================================
// Scène Statistiques (CdC US11) : historique des combats
// (résultat, adversaire, niveau, date) + petit récapitulatif.
// ==========================================

import { register, navigate } from '../core/sceneManager.js';
import { getHistory } from '../core/storage.js';

let listEl, summaryEl;

export function initStats() {
  const root = document.createElement('div');
  root.id = 'scene-stats';
  root.className = 'scene';
  root.style.display = 'none';
  root.innerHTML = `
    <button class="btn-back" id="btn-back-stats">⬅ Retour</button>
    <div class="scene-title">Statistiques</div>
    <div class="stats-summary"></div>
    <div class="history-list"></div>
  `;
  document.getElementById('game-container').appendChild(root);
  register('stats', root, 'flex');

  listEl = root.querySelector('.history-list');
  summaryEl = root.querySelector('.stats-summary');
  root.querySelector('#btn-back-stats').addEventListener('click', () => navigate('home'));

  window.addEventListener('scene:change', (e) => {
    if (e.detail === 'stats') render();
  });
}

function fmtDate(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function render() {
  const history = getHistory();

  if (history.length === 0) {
    summaryEl.textContent = '';
    listEl.innerHTML = '<p class="history-empty">Aucun combat joué pour l\'instant</p>';
    return;
  }

  const wins = history.filter((e) => e.result === 'win').length;
  summaryEl.textContent = `${history.length} combats · ${wins} victoire(s) · ${history.length - wins} défaite(s)`;

  listEl.innerHTML = '';
  history.forEach((e) => {
    const row = document.createElement('div');
    row.className = 'history-row ' + (e.result === 'win' ? 'win' : 'lose');
    row.innerHTML = `
      <div class="h-top">
        <span class="h-res">${e.result === 'win' ? '✓ Victoire' : '✗ Défaite'}</span>
        <span class="h-date">${fmtDate(e.ts)}</span>
      </div>
      <div class="h-detail">${e.catName} vs ${e.opponent} · Niv.${e.level}</div>
    `;
    listEl.appendChild(row);
  });
}
