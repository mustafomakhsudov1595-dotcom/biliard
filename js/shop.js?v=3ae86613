/* Shop: catalog view, search, product sheet, cart, customer accounts, Telegram Mini App. Works without a backend (guest orders go to Telegram). */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = (k, v) => (window.__t ? window.__t(k, v) : k);
const lang = () => (window.__lang ? window.__lang() : 'uz');
const L = o => (o && typeof o === 'object' ? (o[lang()] || o.uz || '') : (o == null ? '' : String(o)));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage may be blocked */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
};
const CATS = ['table', 'balls', 'cues', 'acc'];
const TG_LINK = 'https://t.me/+998888885582';
const money = n => String(Math.round(n * 100) / 100).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' $';

/* ---------- API ---------- */
const api = {
  ready: false, token: store.get('bl_token', ''), user: store.get('bl_user', null), adminToken: '', mini: false,
  async call(path, opt = {}) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), opt.timeout || 8000);
    try {
      const headers = { ...(opt.body ? { 'content-type': 'application/json' } : {}), ...(opt.auth && this.token ? { authorization: 'Bearer ' + this.token } : {}) };
      const r = await fetch('/api' + path, { method: opt.method || (opt.body ? 'POST' : 'GET'), headers, body: opt.body ? JSON.stringify(opt.body) : undefined, signal: ctl.signal });
      let data = null;
      try { data = await r.json(); } catch { /* non-json */ }
      return { ok: r.ok, status: r.status, data };
    } catch (e) { return { ok: false, status: 0, data: null }; }
    finally { clearTimeout(timer); }
  },
  setSession(token, user) {
    this.token = token; this.user = user;
    store.set('bl_token', token); store.set('bl_user', user);
    renderChrome();
  },
  logout() { this.token = ''; this.user = null; this.adminToken = ''; store.del('bl_token'); store.del('bl_user'); renderChrome(); }
};

/* ---------- products ---------- */
let PRODUCTS = [];
const state = { cat: 'all', q: '', sort: 'def' };
const norm = s => String(s || '').toLowerCase().replace(/[’'`ʻʼ‘]/g, '').replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
const byId = id => PRODUCTS.find(p => p.id === id);
function validProducts(list) {
  return Array.isArray(list) ? list.filter(p => p && typeof p.id === 'string' && p.name && p.active !== false).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)) : [];
}
async function loadProducts() {
  const cached = store.get('bl_products', null);
  if (cached && validProducts(cached).length) { PRODUCTS = validProducts(cached); onProducts(); }
  const st = fetch('data/products.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
  const live = api.call('/products', { timeout: 6000 }).then(r => (r.ok && Array.isArray(r.data) ? r.data : null));
  if (!PRODUCTS.length) {
    // give the live catalogue a short head start so hidden/edited products never flash from the static copy
    const first = await Promise.race([live, new Promise(r => setTimeout(() => r(undefined), 1200))]);
    if (Array.isArray(first)) { PRODUCTS = validProducts(first); onProducts(); }
    else { const s = await st; if (validProducts(s).length) { PRODUCTS = validProducts(s); onProducts(); } }
  }
  const l = await live;
  if (Array.isArray(l)) { PRODUCTS = validProducts(l); store.set('bl_products', PRODUCTS); onProducts(); }
  else if (!PRODUCTS.length) {
    const s = await st;
    if (validProducts(s).length) { PRODUCTS = validProducts(s); onProducts(); } else showGridError();
  }
}
function onProducts() {
  cleanCart(); renderShopHome(); renderCatalog(); renderCart(); renderChrome();
}
function showGridError() {
  const g = $('#grid'); if (g) g.innerHTML = `<p class="empty">${esc(t('err_server'))} <button class="btn btn-line" id="retry">↻</button></p>`;
  const b = $('#retry'); if (b) b.onclick = () => { loadProducts(); };
}

/* ---------- pricing ---------- */
function priceOf(p, vi) {
  const v = vi != null && vi >= 0 && p.variants && p.variants[vi] ? p.variants[vi] : null;
  if (v) return { min: v.price, max: v.priceMax || null, from: false };
  if (p.variants && p.variants.length) {
    const mins = p.variants.map(x => x.price).filter(x => x != null);
    if (mins.length) return { min: Math.min(...mins), max: null, from: p.variants.length > 1 || p.variants.some(x => x.priceMax) };
  }
  return { min: p.price, max: p.priceMax || null, from: false };
}
function priceText(pr) {
  if (pr.min == null) return t('quote');
  if (pr.from) return t('from_fmt', { p: money(pr.min) });
  if (pr.max) return `${money(pr.min).replace(' $', '')} – ${money(pr.max)}`;
  return money(pr.min);
}

/* ---------- images ---------- */
function img(url, sizes, alt, eager) {
  if (!url) return '<span class="noimg"></span>';
  const m = /^(img\/opt\/.+)-960\.webp$/.exec(url);
  const set = m ? ` srcset="${esc(m[1])}-480.webp 480w, ${esc(url)} 960w" sizes="${esc(sizes || '50vw')}"` : '';
  return `<img src="${esc(url)}"${set} alt="${esc(alt || '')}" ${eager ? '' : 'loading="lazy"'} decoding="async" onerror="this.onerror=null;this.classList.add('bad')">`;
}

/* ---------- search ---------- */
function score(p, q) {
  if (!q) return 1;
  const words = norm(q).split(' ').filter(Boolean);
  if (!words.length) return 1;
  const nameHay = norm([p.name && Object.values(p.name).join(' '), p.id, p.variants && p.variants.map(v => L(v.name)).join(' ')].join(' '));
  const catHay = norm(t('cat_' + p.cat));
  const descHay = norm([p.desc && Object.values(p.desc).join(' '), p.info && Object.values(p.info).join(' ')].join(' '));
  let total = 0;
  for (const w of words) {
    const wf = w.replace(/\s/g, '');
    if (nameHay.includes(w) || nameHay.replace(/[\s-]/g, '').includes(wf)) total += 10;
    else if (catHay.includes(w)) total += 4;
    else if (descHay.includes(w)) total += 1;
    else return 0;
  }
  return total;
}
function filtered() {
  const inCat = PRODUCTS.filter(p => state.cat === 'all' || p.cat === state.cat);
  let l = state.q ? inCat.map(p => [p, score(p, state.q)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).map(x => x[0]) : inCat;
  const pm = p => { const x = priceOf(p); return x.min == null ? Infinity : x.min; };
  if (state.sort === 'asc') l = [...l].sort((a, b) => pm(a) - pm(b));
  if (state.sort === 'desc') l = [...l].sort((a, b) => (pm(b) === Infinity ? -1 : pm(b)) - (pm(a) === Infinity ? -1 : pm(a)));
  return l;
}

/* ---------- cards ---------- */
function card(p) {
  const pr = priceOf(p), inCart = cart.filter(c => c.id === p.id).reduce((s, c) => s + c.q, 0);
  const badge = L(p.badge);
  return `<article class="pcard" data-id="${esc(p.id)}" tabindex="0" role="button" aria-label="${esc(L(p.name))}">
    <div class="pimg">${img((p.images || [])[0], '(min-width:900px) 23vw,46vw', L(p.name))}${badge ? `<span class="pbadge">${esc(badge)}</span>` : ''}${inCart ? `<span class="pin">${esc(t('in_cart'))} ×${inCart}</span>` : ''}</div>
    <div class="pbody"><h3 class="pname">${esc(L(p.name))}</h3><p class="pdesc">${esc(L(p.desc))}</p>
    <div class="pfoot"><div class="pprice${pr.min == null ? ' q' : ''}">${esc(priceText(pr))}</div><button type="button" class="padd" data-add="${esc(p.id)}" aria-label="${esc(t('add_cart'))}"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></div></div>
  </article>`;
}
function bindCards(root) {
  $$('.pcard', root).forEach(el => {
    const open = () => openProduct(el.dataset.id);
    el.addEventListener('click', e => { if (!e.target.closest('[data-add]')) open(); });
    el.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === el) { e.preventDefault(); open(); } });
  });
  $$('[data-add]', root).forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const p = byId(b.dataset.add); if (!p) return;
    if (p.variants && p.variants.length) openProduct(p.id); else { addToCart(p.id, -1, 1); toast(t('added')); }
  }));
}

/* ---------- home shop block + catalog view ---------- */
function renderShopHome() {
  const tiles = $('#tiles');
  if (tiles) {
    const first = c => PRODUCTS.find(p => p.cat === c && p.images && p.images[0]);
    tiles.innerHTML = CATS.map(c => {
      const n = PRODUCTS.filter(p => p.cat === c).length, f = first(c);
      return n ? `<a class="tile" href="#catalog/${c}"><span class="tile-img">${img(f && f.images[0], '(min-width:900px) 24vw,46vw', t('cat_' + c))}</span><span class="tile-t"><b>${esc(t('cat_' + c))}</b><small>${esc(t('cat_n', { n }))}</small></span></a>` : '';
    }).join('');
  }
  const feat = $('#featured');
  if (feat) {
    const picked = PRODUCTS.filter(p => L(p.badge)).slice(0, 8);
    const rest = PRODUCTS.filter(p => !picked.includes(p));
    for (let i = 0; picked.length < 8 && rest.length; i++) { const c = CATS[i % CATS.length]; const k = rest.findIndex(p => p.cat === c); if (k >= 0) picked.push(rest.splice(k, 1)[0]); else if (i > 20) picked.push(rest.shift()); }
    feat.innerHTML = picked.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)).map(card).join(''); bindCards(feat);
  }
}
function renderCats() {
  const box = $('#cats'); if (!box) return;
  const all = [['all', t('cat_all')], ...CATS.filter(c => PRODUCTS.some(p => p.cat === c)).map(c => [c, t('cat_' + c)])];
  box.innerHTML = all.map(([c, n]) => `<button type="button" role="tab" class="${state.cat === c ? 'on' : ''}" data-c="${c}">${esc(n)}</button>`).join('');
  $$('button', box).forEach(b => b.onclick = () => { const q = $('#q'); if (q) state.q = q.value; state.cat = b.dataset.c; setHash(); renderCatalog(); });
}
function renderCatalog() {
  renderCats();
  const list = filtered(), grid = $('#grid'); if (!grid) return;
  grid.innerHTML = list.map(card).join(''); bindCards(grid);
  $('#empty').hidden = list.length > 0 || !PRODUCTS.length;
  const h = $('#cgTitle'); if (h) h.textContent = state.cat === 'all' ? t('cg_all') : t('cat_' + state.cat);
  const c = $('#cgCount'); if (c) c.textContent = t('found', { n: list.length });
  const q = $('#q'); if (q && q.value !== state.q) q.value = state.q;
  const s = $('#sort'); if (s) s.value = state.sort;
}
function setHash() { const h = '#catalog' + (state.cat !== 'all' ? '/' + state.cat : ''); if (location.hash !== h) history.replaceState(null, '', h); }

/* ---------- router (home / catalog views) ---------- */
let lastView = '';
function route() {
  const h = location.hash;
  if (/^#tgWebApp/.test(h)) { document.body.dataset.view = 'home'; return; }
  if (/^#catalog/.test(h)) {
    const c = h.split('/')[1];
    state.cat = CATS.includes(c) ? c : 'all';
    if (lastView !== 'catalog' && !state.keepQ) state.q = '';
    state.keepQ = false;
    document.body.dataset.view = 'catalog';
    renderCatalog();
    if (lastView !== 'catalog') window.scrollTo(0, 0);
    lastView = 'catalog';
  } else {
    const wasCatalog = lastView === 'catalog';
    document.body.dataset.view = 'home';
    lastView = 'home';
    const id = h.slice(1);
    requestAnimationFrame(() => {
      const el = id && document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: wasCatalog ? 'auto' : 'smooth' });
      else if (wasCatalog) window.scrollTo(0, 0);
    });
  }
  syncTabs();
}
addEventListener('hashchange', route);
function goCatalog(q, cat) { state.q = q || ''; state.keepQ = true; state.cat = cat || 'all'; const h = '#catalog' + (state.cat !== 'all' ? '/' + state.cat : ''); if (location.hash === h) route(); else location.hash = h; }

/* ---------- overlays ---------- */
const scrim = $('#scrim');
let openLayer = null, lastFocus = null;
function layer(el) {
  closeLayers(true);
  lastFocus = document.activeElement;
  openLayer = el; el.hidden = false; scrim.hidden = false;
  document.body.classList.add('noscroll');
  requestAnimationFrame(() => { el.classList.add('on'); scrim.classList.add('on'); const f = $('button,input,select,textarea,a[href]', el); if (f) f.focus({ preventScroll: true }); });
}
function closeLayers(quick) {
  if (!openLayer) return;
  const el = openLayer; openLayer = null;
  el.classList.remove('on'); scrim.classList.remove('on'); document.body.classList.remove('noscroll');
  const done = () => { if (!openLayer) { el.hidden = true; scrim.hidden = true; } };
  if (quick) { el.hidden = true; if (!openLayer) scrim.hidden = true; } else setTimeout(done, 280);
  if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch { /* ignore */ } }
}
scrim.addEventListener('click', () => closeLayers());
addEventListener('keydown', e => { if (e.key === 'Escape' && openLayer) closeLayers(); });
let toastTimer;
function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2200); }

/* ---------- product sheet ---------- */
function openProduct(id) {
  const p = byId(id); if (!p) return;
  const el = $('#pmodal');
  let vi = p.variants && p.variants.length ? 0 : -1, qty = 1, mi = 0;
  const specs = (p.specs && (p.specs[lang()] && p.specs[lang()].length ? p.specs[lang()] : p.specs.uz)) || [];
  const imgs = p.images && p.images.length ? p.images : [''];
  const draw = () => {
    const pr = priceOf(p, vi), cur = imgs[mi];
    el.innerHTML = `<div class="sheet"><button class="x" type="button" data-close aria-label="${esc(t('close'))}">×</button>
      <div class="pm"><div class="pm-media"><div class="pm-main">${img(cur, '(min-width:900px) 40vw,100vw', L(p.name), true)}${L(p.badge) ? `<span class="pbadge">${esc(L(p.badge))}</span>` : ''}</div>
      ${imgs.length > 1 ? `<div class="pm-thumbs">${imgs.map((u, i) => `<button type="button" class="${i === mi ? 'on' : ''}" data-mi="${i}" aria-label="${i + 1}">${img(u, '80px', '')}</button>`).join('')}</div>` : ''}
      ${/\.svg$/.test(cur || '') ? `<p class="illu">${esc(t('illu'))}</p>` : ''}</div>
      <div class="pm-info"><small class="pm-cat">${esc(t('cat_' + p.cat))}</small><h2>${esc(L(p.name))}</h2>
      <div class="pm-price${pr.min == null ? ' q' : ''}">${esc(priceText(pr))}${pr.min != null && !pr.max && !pr.from && L(p.unit) ? `<small> / ${esc(L(p.unit))}</small>` : ''}</div>
      ${p.variants && p.variants.length ? `<div class="pm-var" role="radiogroup" aria-label="${esc(t('options'))}">${p.variants.map((v, i) => `<button type="button" role="radio" aria-checked="${i === vi}" class="${i === vi ? 'on' : ''}" data-vi="${i}"><b>${esc(L(v.name))}</b><span>${esc(priceText(priceOf(p, i)))}</span></button>`).join('')}</div>` : ''}
      <div class="pm-buy"><div class="step" aria-label="${esc(t('qty'))}"><button type="button" data-q="-1" aria-label="−">−</button><output>${qty}</output><button type="button" data-q="1" aria-label="+">+</button></div>
      <button class="btn btn-gold" type="button" data-addp>${esc(t('add_cart'))}</button></div>
      ${pr.max || pr.min == null ? `<p class="hint">${esc(t('quote_note'))}</p>` : ''}
      ${L(p.info) || L(p.desc) ? `<h4>${esc(t('about_h'))}</h4><p class="pm-text">${esc(L(p.info) || L(p.desc))}</p>` : ''}
      ${specs.length ? `<h4>${esc(t('specs_h'))}</h4><dl class="specs">${specs.map(r => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>` : ''}
      </div></div></div>`;
    $('[data-close]', el).onclick = () => closeLayers();
    $$('[data-mi]', el).forEach(b => b.onclick = () => { mi = +b.dataset.mi; draw(); });
    $$('[data-vi]', el).forEach(b => b.onclick = () => { vi = +b.dataset.vi; draw(); });
    $$('[data-q]', el).forEach(b => b.onclick = () => { qty = Math.min(99, Math.max(1, qty + +b.dataset.q)); $('output', el).textContent = qty; });
    $('[data-addp]', el).onclick = () => { addToCart(p.id, vi, qty); closeLayers(); toast(t('added')); };
  };
  draw(); layer(el);
}

/* ---------- cart ---------- */
let cart = store.get('bl_cart', []);
if (!Array.isArray(cart)) cart = [];
const saveCart = () => { store.set('bl_cart', cart); renderChrome(); };
function cleanCart() {
  if (!PRODUCTS.length) return;
  const before = cart.length;
  cart = cart.filter(c => c && byId(c.id) && Number.isInteger(c.q) && c.q > 0 && (c.v === -1 || (byId(c.id).variants || [])[c.v]));
  if (cart.length !== before) store.set('bl_cart', cart);
}
function addToCart(id, v, q) {
  const line = cart.find(c => c.id === id && c.v === v);
  if (line) line.q = Math.min(99, line.q + q); else cart.push({ id, v, q: Math.min(99, q) });
  saveCart(); bump(); renderCatalog(); renderShopHome();
}
function bump() { $$('.badge').forEach(b => { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }); }
function lines() {
  return cart.map(c => { const p = byId(c.id); if (!p) return null; const pr = priceOf(p, c.v); const v = c.v >= 0 ? p.variants[c.v] : null; return { ...c, p, pr, v }; }).filter(Boolean);
}
function totals() {
  const ls = lines();
  return { total: ls.reduce((s, l) => s + (l.pr.min != null && !l.pr.max ? l.pr.min * l.q : 0), 0), quote: ls.some(l => l.pr.min == null || l.pr.max), count: ls.reduce((s, l) => s + l.q, 0) };
}
let cartStep = 'cart', lastOrder = null;
function renderCart() {
  const el = $('#cart'); if (!el) return;
  const ls = lines(), tt = totals();
  let body = '';
  if (cartStep === 'done' && lastOrder) {
    body = `<div class="done"><div class="ok"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></div><h3>${esc(t('ck_ok_h'))}</h3><p>${esc(t('ck_ok_p', { id: lastOrder.id }))}</p>
      <button class="btn btn-gold" type="button" data-close>${esc(t('close'))}</button></div>`;
  } else if (cartStep === 'checkout' && ls.length) {
    const u = api.user || {};
    body = `<form class="co" id="coForm" novalidate>
      <label>${esc(t('ck_phone'))}<input name="phone" type="tel" inputmode="tel" autocomplete="tel" required value="${esc(u.phone ? '+' + u.phone : '')}" placeholder="+998 __ ___ __ __"></label>
      ${api.ready ? '' : `<label>${esc(t('auth_name'))}<input name="name" autocomplete="name" required value="${esc(u.name || '')}"></label>`}
      <label>${esc(t('ck_city'))}<input name="city" autocomplete="address-level2" value="${esc(u.city || '')}"></label>
      <label>${esc(t('ck_addr'))}<input name="address" autocomplete="street-address"></label>
      <label>${esc(t('ck_note'))}<textarea name="note" rows="2"></textarea></label>
      <input type="text" name="hp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="err" id="coErr" hidden></p>
      ${api.ready ? '' : `<p class="hint">${esc(t('ck_guest'))}</p>`}
      <div class="cart-sum"><span>${esc(t('cart_total'))}</span><b>${esc(money(tt.total))}</b></div>
      <button class="btn btn-gold wide" type="submit" id="coBtn">${esc(api.ready ? t('ck_send') : t('ck_tg'))}</button>
      <button class="btn btn-line wide" type="button" id="coBack">${esc(t('back'))}</button></form>`;
  } else if (!ls.length) {
    body = `<div class="empty-cart"><svg viewBox="0 0 24 24"><path d="M3 4h2l2.5 11h10L20 7H6"/><circle cx="9" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/></svg><p>${esc(t('cart_empty'))}</p><a class="btn btn-gold" href="#catalog" data-close>${esc(t('to_cat'))}</a></div>`;
  } else {
    body = `<ul class="cl">${ls.map((l, i) => `<li><div class="cl-img">${img((l.p.images || [])[0], '80px', L(l.p.name))}</div>
      <div class="cl-t"><b>${esc(L(l.p.name))}</b>${l.v ? `<small>${esc(L(l.v.name))}</small>` : ''}<span class="${l.pr.min == null || l.pr.max ? 'q' : ''}">${esc(l.pr.min == null || l.pr.max ? (l.pr.min == null ? t('quote') : priceText(l.pr) + ' · ' + t('quote')) : money(l.pr.min * l.q))}</span></div>
      <div class="cl-c"><div class="step sm"><button type="button" data-ci="${i}" data-d="-1" aria-label="−">−</button><output>${l.q}</output><button type="button" data-ci="${i}" data-d="1" aria-label="+">+</button></div>
      <button type="button" class="rm" data-rm="${i}" aria-label="${esc(t('remove'))}"><svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg></button></div></li>`).join('')}</ul>
      <div class="cart-foot"><div class="cart-sum"><span>${esc(t('cart_total'))}</span><b>${esc(money(tt.total))}</b></div>${tt.quote ? `<p class="hint">${esc(t('cart_quote'))}</p>` : ''}
      <button class="btn btn-gold wide" type="button" id="goCo">${esc(t('checkout'))}</button></div>`;
  }
  el.innerHTML = `<header><h3>${esc(cartStep === 'checkout' ? t('ck_h') : t('cart_h'))}${tt.count && cartStep === 'cart' ? ` <small>(${tt.count})</small>` : ''}</h3><button class="x" type="button" data-close aria-label="${esc(t('close'))}">×</button></header><div class="drawer-body">${body}</div>`;
  $$('[data-close]', el).forEach(b => b.addEventListener('click', () => closeLayers()));
  $$('[data-ci]', el).forEach(b => b.onclick = () => { const l = cart[+b.dataset.ci]; if (!l) return; l.q = Math.min(99, l.q + +b.dataset.d); if (l.q <= 0) cart.splice(+b.dataset.ci, 1); saveCart(); renderCart(); renderCatalog(); renderShopHome(); });
  $$('[data-rm]', el).forEach(b => b.onclick = () => { cart.splice(+b.dataset.rm, 1); saveCart(); renderCart(); renderCatalog(); renderShopHome(); });
  const go = $('#goCo', el); if (go) go.onclick = startCheckout;
  const back = $('#coBack', el); if (back) back.onclick = () => { cartStep = 'cart'; renderCart(); };
  const form = $('#coForm', el); if (form) form.onsubmit = submitOrder;
}
function openCart(step) { cartStep = step || 'cart'; if (cartStep === 'done' && !lastOrder) cartStep = 'cart'; renderCart(); layer($('#cart')); }
function startCheckout() {
  if (api.ready && !api.user) { openAuth('login', t('auth_need'), () => { cartStep = 'checkout'; openCart('checkout'); }); return; }
  cartStep = 'checkout'; renderCart();
}
function tgText(f) {
  const ls = lines(), tt = totals();
  return `${t('tg_head')}\n${ls.map(l => `• ${L(l.p.name)}${l.v ? ' (' + L(l.v.name) + ')' : ''} × ${l.q} — ${l.pr.min == null ? t('quote') : priceText(l.pr)}`).join('\n')}\n\n${t('cart_total')}: ${money(tt.total)}${tt.quote ? ' + ' + t('quote').toLowerCase() : ''}\n${t('auth_name')}: ${f.name || ''}\n${t('ck_phone')}: ${f.phone || ''}\n${t('ck_city')}: ${f.city || ''} ${f.address || ''}\n${f.note ? t('ck_note') + ': ' + f.note : ''}`;
}
async function submitOrder(e) {
  e.preventDefault();
  const form = e.target, f = Object.fromEntries(new FormData(form).entries()), err = $('#coErr'), btn = $('#coBtn');
  const showErr = m => { err.textContent = m; err.hidden = false; };
  err.hidden = true;
  if (f.hp) return;
  const digits = String(f.phone || '').replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) { showErr(t('err_phone')); return; }
  if (!api.ready) {
    if (!String(f.name || '').trim()) { showErr(t('err_name')); return; }
    const url = TG_LINK + '?text=' + encodeURIComponent(tgText(f));
    if (window.__open) window.__open(url); else window.open(url, '_blank');
    return;
  }
  btn.disabled = true; btn.textContent = t('ck_sending');
  const items = cart.map(c => ({ id: c.id, v: c.v, q: c.q }));
  const r = await api.call('/orders', { auth: true, body: { items, phone: f.phone, city: f.city, address: f.address, note: f.note, lang: lang() }, timeout: 15000 });
  btn.disabled = false; btn.textContent = t('ck_send');
  if (r.status === 401) { api.logout(); openAuth('login', t('auth_need'), () => openCart('checkout')); return; }
  if (!r.ok) { showErr(r.status === 400 ? t('err_items') : t('err_server')); return; }
  lastOrder = r.data.order; cart = []; saveCart(); cartStep = 'done'; renderCart(); renderCatalog(); renderShopHome();
}

/* ---------- auth + profile ---------- */
function openAuth(mode, note, after) {
  const el = $('#amodal');
  let m = mode || 'login';
  const draw = (msg) => {
    const reg = m === 'reg';
    el.innerHTML = `<div class="sheet auth"><button class="x" type="button" data-close aria-label="${esc(t('close'))}">×</button>
      <div class="ball sm">8</div><h3>${esc(reg ? t('auth_h_reg') : t('auth_h_login'))}</h3>${note ? `<p class="hint">${esc(note)}</p>` : ''}
      <form id="auForm" novalidate>
        ${reg ? `<label>${esc(t('auth_name'))}<input name="name" autocomplete="name" required></label>` : ''}
        <label>${esc(t('auth_phone'))}<input name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="+998 __ ___ __ __"></label>
        ${reg ? `<label>${esc(t('auth_city'))}<input name="city" autocomplete="address-level2"></label>` : ''}
        <label>${esc(t('auth_pass'))}<input name="password" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" required minlength="6"></label>
        <p class="err" id="auErr" ${msg ? '' : 'hidden'}>${esc(msg || '')}</p>
        <button class="btn btn-gold wide" type="submit" id="auBtn">${esc(reg ? t('auth_reg_btn') : t('auth_login_btn'))}</button>
      </form>
      <button class="link" type="button" id="auSwitch">${esc(reg ? t('auth_switch_login') : t('auth_switch_reg'))}</button></div>`;
    $('[data-close]', el).onclick = () => closeLayers();
    $('#auSwitch', el).onclick = () => { m = reg ? 'login' : 'reg'; draw(); layerFocus(); };
    $('#auForm', el).onsubmit = async ev => {
      ev.preventDefault();
      const f = Object.fromEntries(new FormData(ev.target).entries()), btn = $('#auBtn', el), er = $('#auErr', el);
      const bad = x => { er.textContent = x; er.hidden = false; };
      er.hidden = true;
      const digits = String(f.phone || '').replace(/\D/g, '');
      if (reg && String(f.name || '').trim().length < 2) return bad(t('err_name'));
      if (digits.length < 9 || digits.length > 15) return bad(t('err_phone'));
      if (!f.password || f.password.length < 6) return bad(t('err_pass'));
      btn.disabled = true;
      const r = await api.call(reg ? '/register' : '/login', { body: f });
      btn.disabled = false;
      if (r.ok && r.data && r.data.token) { api.setSession(r.data.token, r.data.user); closeLayers(); toast(t('hello', { name: r.data.user.name })); if (after) setTimeout(after, 320); return; }
      const e = r.data && r.data.error;
      bad(e === 'exists' ? t('err_exists') : e === 'credentials' ? t('err_cred') : r.status === 429 ? t('err_locked') : e === 'phone' ? t('err_phone') : e === 'name' ? t('err_name') : e === 'password' ? t('err_pass') : t('err_server'));
    };
  };
  const layerFocus = () => { const f = $('input', el); if (f) f.focus({ preventScroll: true }); };
  draw(); layer(el);
}
async function openProfile() {
  if (!api.ready) { toast(t('err_server')); return; }
  if (!api.user) { openAuth('login'); return; }
  const el = $('#amodal');
  const draw = orders => {
    const u = api.user;
    el.innerHTML = `<div class="sheet auth prof"><button class="x" type="button" data-close aria-label="${esc(t('close'))}">×</button>
      <div class="ball sm">${esc((u.name || '?').trim().charAt(0).toUpperCase())}</div><h3>${esc(u.name)}</h3>
      <p class="hint">${u.phone ? '+' + esc(u.phone) : ''}${u.username ? ' @' + esc(u.username) : ''}${u.city ? ' · ' + esc(u.city) : ''}</p>
      ${api.adminToken ? `<a class="btn btn-gold wide" href="/admin/" id="toAdmin">${esc(t('pf_admin'))}</a>` : ''}
      <h4>${esc(t('pf_orders'))}</h4>
      ${orders === null ? `<p class="hint">…</p>` : orders.length ? `<ul class="ol">${orders.map(o => `<li><div><b>${esc(o.id)}</b><small>${esc(new Date(o.ts).toLocaleDateString())}</small></div><span class="st st-${esc(o.status)}">${esc(t('st_' + o.status))}</span><div class="ol-i">${esc(o.items.map(i => i.name + ' ×' + i.qty).join(', '))}</div><b class="ol-t">${o.total ? esc(money(o.total)) : ''}${o.quote ? ' +' : ''}</b></li>`).join('')}</ul>` : `<p class="hint">${esc(t('pf_none'))}</p>`}
      ${api.mini ? '' : `<button class="link" type="button" id="lo">${esc(t('logout'))}</button>`}</div>`;
    $('[data-close]', el).onclick = () => closeLayers();
    const lo = $('#lo', el); if (lo) lo.onclick = () => { api.logout(); closeLayers(); };
    const ad = $('#toAdmin', el); if (ad) ad.onclick = () => { try { sessionStorage.setItem('bl_admin_token', api.adminToken); } catch { /* ignore */ } };
  };
  draw(null); layer(el);
  const r = await api.call('/me', { auth: true });
  if (r.status === 401) { api.logout(); closeLayers(); openAuth('login'); return; }
  if (r.ok) { api.user = r.data.user; store.set('bl_user', api.user); draw(r.data.orders || []); }
  else draw([]);
}

/* ---------- chrome (badges, tab bar, admin button) ---------- */
function renderChrome() {
  const n = totals().count;
  ['cartBadge', 'tabBadge'].forEach(id => { const b = document.getElementById(id); if (b) { b.textContent = n > 99 ? '99+' : n; b.hidden = !n; } });
  const tab = $('#tabAcc'); if (tab) tab.classList.toggle('signed', !!api.user);
}
function syncTabs() {
  const v = document.body.dataset.view;
  $$('#tabbar [data-tab]').forEach(a => { const k = a.dataset.tab; a.classList.toggle('on', (k === 'catalog' && v === 'catalog') || (k === 'top' && v !== 'catalog')); });
}

/* ---------- Telegram Mini App ---------- */
async function initTelegram() {
  for (let i = 0; i < 15 && !(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData); i++) {
    if (!/tgWebApp/.test(location.hash + location.search) && i > 4) return;
    await new Promise(r => setTimeout(r, 100));
  }
  const wa = window.Telegram && window.Telegram.WebApp;
  if (!wa || !wa.initData) return;
  api.mini = true;
  document.documentElement.classList.add('mini');
  try { wa.ready(); wa.expand(); wa.setHeaderColor && wa.setHeaderColor('#07110c'); wa.setBackgroundColor && wa.setBackgroundColor('#07110c'); } catch { /* old client */ }
  if (!api.ready) return;
  const r = await api.call('/tg-auth', { body: { initData: wa.initData } });
  if (r.ok && r.data && r.data.token) {
    api.setSession(r.data.token, r.data.user);
    if (r.data.adminToken) { api.adminToken = r.data.adminToken; try { sessionStorage.setItem('bl_admin_token', r.data.adminToken); } catch { /* ignore */ } document.documentElement.classList.add('is-admin'); }
  }
}

/* ---------- wiring ---------- */
function bind() {
  $('#btnCart').onclick = () => openCart('cart');
  $('#tabCart').onclick = () => openCart('cart');
  const acc = () => openProfile();
  $('#btnAcc').onclick = acc; $('#tabAcc').onclick = acc;
  const q = $('#q'); let qt;
  q.addEventListener('input', () => { clearTimeout(qt); qt = setTimeout(() => { state.q = q.value; renderCatalog(); }, 120); });
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; renderCatalog(); });
  $('#shopSearch').addEventListener('submit', e => { e.preventDefault(); goCatalog($('#shopQ').value.trim(), 'all'); });
  $('#clearQ').addEventListener('click', () => { state.q = ''; renderCatalog(); q.focus(); });
  document.addEventListener('langchange', () => { renderShopHome(); renderCatalog(); renderCart(); renderChrome(); if (openLayer && openLayer.id === 'amodal' && api.user) openProfile(); });
  $$('a[data-close]').forEach(a => a.addEventListener('click', () => closeLayers()));
}
async function boot() {
  bind(); renderChrome();
  const ping = await api.call('/ping', { timeout: 4000 });
  api.ready = !!(ping.ok && ping.data && ping.data.ready);
  const prod = loadProducts();
  route();
  if (api.ready && api.token) { const me = await api.call('/me', { auth: true }); if (me.ok) { api.user = me.data.user; store.set('bl_user', api.user); } else if (me.status === 401) api.logout(); }
  await initTelegram();
  renderChrome();
  await prod;
  route();
  const sp = new URLSearchParams(location.search), qc = sp.get('c');
  if (qc === 'all' || CATS.includes(qc)) goCatalog((sp.get('q') || '').slice(0, 60), qc);
  else if (sp.get('q')) goCatalog(sp.get('q').slice(0, 60), 'all');
}
boot().catch(e => { console.error(e); });
})();
