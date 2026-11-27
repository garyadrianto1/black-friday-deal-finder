// DealScore boot + hash router. Routes: #/ (home), #/best (best deals),
// #/categories, #/stores, #/category/<slug>, #/store/<slug>, #/deal/<slug>.
// Filters live on the home page and re-render the grid in place.

import { DEALS } from './data.js';
import { homeHtml, dealHtml, categoriesHtml, storesHtml, applyFilters } from './views.js';

const app = document.getElementById('app');

const state = { q: '', category: '', store: '', minDiscount: 0, sort: 'best' };

function render() {
  const hash = location.hash || '#/';
  const [pathPart, queryPart] = hash.slice(2).split('?');
  const parts = pathPart.split('/').filter(Boolean);
  const qp = new URLSearchParams(queryPart || '');
  if (parts[0] === 'deal' && parts[1]) {
    const deal = DEALS.find(d => d.slug === parts[1]);
    app.innerHTML = deal ? dealHtml(deal) : '<div class="wrap"><div class="empty">That deal is not on this site.</div></div>';
    window.scrollTo(0, 0);
    return;
  }
  if (parts[0] === 'best') {
    state.category = '';
    state.store = '';
    state.q = '';
    state.minDiscount = Number(qp.get('min')) || 0;
    state.sort = 'best';
    app.innerHTML = homeHtml(state, applyFilters(DEALS, state));
    bindFilters();
    const best = document.querySelector('.section-title');
    if (best) best.scrollIntoView();
    return;
  }
  if (parts[0] === 'categories') {
    app.innerHTML = categoriesHtml();
    window.scrollTo(0, 0);
    return;
  }
  if (parts[0] === 'stores') {
    app.innerHTML = storesHtml();
    window.scrollTo(0, 0);
    return;
  }
  if (parts[0] === 'category' && parts[1]) state.category = parts[1];
  else if (parts[0] !== 'category') state.category = '';
  if (parts[0] === 'store' && parts[1]) state.store = parts[1];
  else if (parts[0] !== 'store') state.store = '';
  app.innerHTML = homeHtml(state, applyFilters(DEALS, state));
  bindFilters();
}

function bindFilters() {
  const q = document.getElementById('f-q');
  const cat = document.getElementById('f-cat');
  const store = document.getElementById('f-store');
  const disc = document.getElementById('f-disc');
  const sort = document.getElementById('f-sort');
  if (!q) return;
  q.addEventListener('input', () => { state.q = q.value; rerenderGrid(); });
  cat.addEventListener('change', () => { state.category = cat.value; rerenderGrid(); });
  store.addEventListener('change', () => { state.store = store.value; rerenderGrid(); });
  disc.addEventListener('change', () => { state.minDiscount = Number(disc.value) || 0; rerenderGrid(); });
  sort.addEventListener('change', () => { state.sort = sort.value; rerenderGrid(); });
}

function rerenderGrid() {
  app.innerHTML = homeHtml(state, applyFilters(DEALS, state));
  bindFilters();
  const q = document.getElementById('f-q');
  if (q && state.q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
}

window.addEventListener('hashchange', render);
render();
