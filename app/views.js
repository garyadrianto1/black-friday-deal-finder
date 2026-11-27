// DealScore rendering: deal cards, home page, detail page, compare table.
// All prices come from data.js; the discount is computed here from the two
// prices so the number on screen can never disagree with them.

import { DEALS, CATEGORIES, STORES } from './data.js';

export function money(n) {
  return '$' + n.toFixed(2);
}

export function discountOf(d) {
  return Math.round((d.usual - d.sale) / d.usual * 100);
}

export function savingsOf(d) {
  return Math.round((d.usual - d.sale) * 100) / 100;
}

export function saveMoney(n) {
  return Number.isInteger(n) ? '$' + n : '$' + n.toFixed(2);
}

export function moneyTotal(n) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const VERDICT_CLASS = { 'NEW LOW': 'newlow', STRONG: 'strong', ROUTINE: 'routine', INFLATED: 'inflated' };

export function verdictChip(d) {
  return '<span class="verdict ' + VERDICT_CLASS[d.verdict] + '">' + d.verdict + '</span>';
}

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function cardHtml(d, featured) {
  const off = discountOf(d);
  let warn = '';
  if (d.verdict === 'INFLATED') {
    warn = '<div class="warn">INFLATED — usual price is above the recent street price</div>';
  }
  const meta = featured
    ? '<div class="meta">Checked ' + esc(d.checked.replace(' (UTC+7)', '')) + ' · Source: ' + esc(d.source) + '</div>'
    : '<div class="meta">Checked ' + esc(d.checked.replace(' (UTC+7)', '')) + ' · Source: ' + esc(d.source) + '</div>';
  return '<article class="card">'
    + '<h3><a href="#/deal/' + d.slug + '">' + esc(d.product) + '</a></h3>'
    + '<div class="store">' + esc(d.store) + ' · ' + esc(d.category) + '</div>'
    + '<div class="price-row"><span class="sale">' + money(d.sale) + '</span>'
    + '<span class="usual">' + money(d.usual) + '</span>'
    + '<span class="off">' + off + '% off</span></div>'
    + '<div class="save">You save ' + saveMoney(savingsOf(d)) + '</div>'
    + verdictChip(d) + warn
    + '<p class="evidence">' + esc(d.evidence) + '</p>'
    + meta
    + '<a class="store-link" href="' + esc(d.url) + '" target="_blank" rel="noopener">View at ' + esc(d.store) + ' ↗</a>'
    + '</article>';
}

const VERDICT_RANK = { 'NEW LOW': 0, STRONG: 1, ROUTINE: 2, INFLATED: 3 };

export function bestDeals(deals) {
  const pool = deals.filter(d => d.verdict !== 'INFLATED');
  pool.sort((a, b) => {
    const r = VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict];
    if (r !== 0) return r;
    const off = discountOf(b) - discountOf(a);
    if (off !== 0) return off;
    if (a.sale !== b.sale) return a.sale - b.sale;
    return b.checked.localeCompare(a.checked);
  });
  return pool.slice(0, 3);
}

export function applyFilters(deals, state) {
  let out = deals.slice();
  if (state.category) out = out.filter(d => d.categorySlug === state.category);
  if (state.store) out = out.filter(d => d.storeSlug === state.store);
  if (state.minDiscount) out = out.filter(d => discountOf(d) >= state.minDiscount);
  if (state.q) {
    const q = state.q.toLowerCase();
    out = out.filter(d => (d.product + ' ' + d.store + ' ' + d.category).toLowerCase().includes(q));
  }
  if (state.sort === 'discount') out.sort((a, b) => discountOf(b) - discountOf(a));
  else if (state.sort === 'price') out.sort((a, b) => a.sale - b.sale);
  else out.sort((a, b) => {
    const r = VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict];
    if (r !== 0) return r;
    return discountOf(b) - discountOf(a);
  });
  return out;
}

export function filterBarHtml(state, count) {
  const catOpts = '<option value="">All categories</option>' + CATEGORIES.map(c =>
    '<option value="' + c.slug + '"' + (state.category === c.slug ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('');
  const storeOpts = '<option value="">All stores</option>' + STORES.map(s =>
    '<option value="' + s.slug + '"' + (state.store === s.slug ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('');
  const discOpts = [['', 'Any discount'], ['20', '20% off or more'], ['30', '30% off or more'], ['40', '40% off or more']]
    .map(([v, l]) => '<option value="' + v + '"' + (String(state.minDiscount || '') === v ? ' selected' : '') + '>' + l + '</option>').join('');
  const sortOpts = [['best', 'Best verdict first'], ['discount', 'Biggest discount'], ['price', 'Lowest price']]
    .map(([v, l]) => '<option value="' + v + '"' + (state.sort === v ? ' selected' : '') + '>' + l + '</option>').join('');
  return '<div class="filters">'
    + '<div class="grow"><label for="f-q">Search deals</label><input id="f-q" type="search" placeholder="Search products, stores…" value="' + esc(state.q || '') + '"></div>'
    + '<div><label for="f-cat">Category</label><select id="f-cat">' + catOpts + '</select></div>'
    + '<div><label for="f-store">Store</label><select id="f-store">' + storeOpts + '</select></div>'
    + '<div><label for="f-disc">Discount</label><select id="f-disc">' + discOpts + '</select></div>'
    + '<div><label for="f-sort">Sort by</label><select id="f-sort">' + sortOpts + '</select></div>'
    + '<div class="count-chip" title="Deals matching the current filters"><b>' + count + ' deals</b></div>'
    + '</div>';
}

export function homeHtml(state, filtered) {
  const best = bestDeals(DEALS);
  const bestOff = Math.max(...DEALS.map(discountOf));
  const storeCount = new Set(DEALS.map(d => d.store)).size;
  const totalSave = DEALS.reduce((s, d) => s + Math.round((d.usual - d.sale) * 100), 0) / 100;
  let html = '<section class="hero"><div class="wrap">'
    + '<h1>Real Black Friday deals, checked today</h1>'
    + '<p>' + DEALS.length + ' deals from ' + storeCount + ' stores — every price read live on 27 Nov 2026, each with an honest verdict.</p>'
    + '<div class="hero-stats">'
    + '<div class="stat"><b>' + DEALS.length + '</b><span>deals checked</span></div>'
    + '<div class="stat"><b>' + storeCount + '</b><span>stores</span></div>'
    + '<div class="stat"><b>' + bestOff + '%</b><span>biggest discount</span></div>'
    + '<div class="stat"><b>' + moneyTotal(totalSave) + '</b><span>total savings</span></div>'
    + '<div class="stat"><b>27 Nov 2026</b><span>all prices checked</span></div>'
    + '</div></div></section>'
    + '<div class="wrap"><div id="home-body">'
    + filterBarHtml(state, filtered.length);
  const filteredActive = Boolean(state.category || state.store || state.q || state.minDiscount || state.sort !== 'best');
  if (filteredActive) {
    html += '<p class="count">Showing <b>' + filtered.length + '</b> of <b>' + DEALS.length + '</b> deals</p>';
  }
  if (!filteredActive) {
    html += '<h2 class="section-title">Best deals</h2>'
      + '<div class="grid featured">' + best.map(x => cardHtml(x, true)).join('') + '</div>';
  }
  html += '<h2 class="section-title">' + (filteredActive ? 'Matching deals' : 'All deals') + '</h2>'
    + '<div class="grid">' + (filtered.length ? filtered.map(d => cardHtml(d)).join('') : '') + '</div>';
  if (!filtered.length) {
    html += '<div class="empty">No deals match those filters. Try widening the search or clearing a filter.</div>';
  }
  html += '</div></div>';
  return html;
}

export function categoriesHtml() {
  const chips = CATEGORIES.map(c => {
    const n = DEALS.filter(d => d.categorySlug === c.slug).length;
    return '<a class="chip" href="#/category/' + c.slug + '">' + esc(c.name) + ' <b>' + n + '</b></a>';
  }).join('');
  return '<div class="wrap"><h2 class="section-title" style="margin-top:18px">Categories</h2>'
    + '<p class="section-sub">Every category holds deals checked live on 27 Nov 2026.</p>'
    + '<div class="chip-list">' + chips + '</div></div>';
}

export function storesHtml() {
  const chips = STORES.map(s => {
    const n = DEALS.filter(d => d.storeSlug === s.slug).length;
    return '<a class="chip" href="#/store/' + s.slug + '">' + esc(s.name) + ' <b>' + n + '</b></a>';
  }).join('');
  return '<div class="wrap"><h2 class="section-title" style="margin-top:18px">Stores</h2>'
    + '<p class="section-sub">Deals by store — each deal links to the product at that store.</p>'
    + '<div class="chip-list">' + chips + '</div></div>';
}

const VERDICT_MEANING = {
  'NEW LOW': 'NEW LOW means this is the lowest price we could verify for this product in the last 90 days.',
  STRONG: 'STRONG means this price is at or below the lowest recent price we could verify.',
  ROUTINE: 'ROUTINE means this is an ordinary sale price — a real discount, but not a standout.',
  INFLATED: 'INFLATED means the usual price sits above the recent street price, so the discount is smaller than it looks.',
};

export function dealHtml(d) {
  const off = discountOf(d);
  const group = DEALS.filter(x => x.group === d.group && x.group);
  const evidenceLong = d.evidence + ' ' + VERDICT_MEANING[d.verdict]
    + ' Checked ' + d.checked + '. Source: ' + d.source + '.';
  let side = '';
  if (group.length > 1) {
    const sorted = group.slice().sort((a, b) => a.sale - b.sale);
    const low = sorted[0].sale;
    const high = sorted[sorted.length - 1].sale;
    const rows = sorted.map((x, i) => '<div class="cmp-row' + (i === 0 ? ' best' : '') + '">'
      + '<div class="cmp-store">' + esc(x.store) + (i === 0 ? ' <span class="win">lowest</span>' : '') + '</div>'
      + '<div class="cmp-price"><span class="sale">' + money(x.sale) + '</span> '
      + '<span class="usual">' + money(x.usual) + '</span> '
      + '<span class="off">' + discountOf(x) + '% off</span></div>'
      + '<div>' + verdictChip(x) + '</div>'
      + '<div class="cmp-meta">Checked ' + esc(x.checked) + '</div>'
      + '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">View at ' + esc(x.store) + ' ↗</a>'
      + '</div>').join('');
    side = '<div class="compare"><h2>Same product at ' + group.length + ' stores</h2>'
      + rows
      + '<p class="source">Lowest ' + money(low) + ' at ' + esc(sorted[0].store) + ' — saves ' + money(sorted[1].sale - low)
      + ' vs the next store; spread lowest to highest ' + money(high - low) + '. The lowest price is ' + sorted[0].verdict + '.</p></div>';
  } else {
    side = '<div class="side-note"><h2>Availability</h2><p>Only at ' + esc(d.store)
      + ' in this round-up — no other store in our checked set carries the same product at a comparable price.</p></div>';
  }
  let warn = '';
  if (d.verdict === 'INFLATED') {
    warn = '<div class="warn">INFLATED — the usual price sits above the recent street price, so the discount is smaller than it looks.</div>';
  }
  let cond = '';
  if (d.condition) cond = '<p class="source">Condition: ' + esc(d.condition) + '</p>';
  const conditions = '<div class="conditions"><h2>Conditions</h2><ul>'
    + '<li>No coupon code needed — this is the live store price.</li>'
    + '<li>No minimum spend.</li>'
    + '<li>Prices move during Black Friday — check the price on the store page before you buy.</li>'
    + '</ul></div>';
  return '<div class="wrap">'
    + '<p class="crumbs"><a href="#/">All deals</a> &gt; <a href="#/category/' + d.categorySlug + '">' + esc(d.category)
    + '</a> &gt; <a href="#/store/' + d.storeSlug + '">' + esc(d.store) + '</a></p>'
    + '<div class="detail-layout"><article class="detail">'
    + '<h1>' + esc(d.product) + '</h1>'
    + '<div class="store">' + esc(d.store) + ' · ' + esc(d.category) + '</div>'
    + '<div class="price-row"><span class="sale">' + money(d.sale) + '</span>'
    + '<span class="usual">' + money(d.usual) + '</span>'
    + '<span class="off">' + off + '% off</span></div>'
    + verdictChip(d) + warn
    + '<p class="evidence">' + esc(evidenceLong) + '</p>'
    + '<p class="source-url">' + esc(d.url) + '</p>'
    + cond
    + '<a class="store-link" href="' + esc(d.url) + '" target="_blank" rel="noopener">View at ' + esc(d.store) + ' ↗</a>'
    + '</article><aside class="detail-side">' + side + '</aside></div>'
    + conditions
    + '<a class="back" href="#/">← Back to all deals</a>'
    + '</div>';
}
