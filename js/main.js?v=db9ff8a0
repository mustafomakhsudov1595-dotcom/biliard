(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
root.classList.add('js');

/* ---------- i18n ---------- */
const D = window.I18N;
let lang = 'uz';
const t = (k, v) => {
  let s = (D[lang] && D[lang][k]) ?? D.uz[k] ?? k;
  if (v) for (const x in v) s = s.replaceAll('{' + x + '}', v[x]);
  return s;
};
$$('[data-i18n]').forEach(el => { el.dataset.uz = el.innerHTML; });
$$('[data-i18n-ph]').forEach(el => { el.dataset.uzPh = el.placeholder; });

function splitWords(el) {
  let i = 0;
  const walk = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(p => {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span'); w.className = 'w'; w.style.setProperty('--i', i++);
        const s = document.createElement('span'); s.textContent = p; w.appendChild(s); frag.appendChild(w);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1) walk(n);
  });
  walk(el);
}
window.__t = t; window.__lang = () => lang;
window.__open = url => {
  const wa = window.Telegram && window.Telegram.WebApp;
  if (wa && wa.initData && wa.openTelegramLink && /^https:\/\/t\.me\//.test(url)) { wa.openTelegramLink(url); return; }
  const w = window.open(url, '_blank');
  if (!w) location.href = url; else { try { w.opener = null; } catch (e) { /* ignore */ } }
};
function setText(el, html) { el.innerHTML = html; if (el.hasAttribute('data-split')) splitWords(el); }

function setLang(l, save = true) {
  lang = D[l] ? l : 'uz';
  root.lang = lang;
  $$('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    const html = lang === 'uz' ? el.dataset.uz : (D[lang][k] ?? el.dataset.uz);
    setText(el, html);
  });
  $$('[data-i18n-ph]').forEach(el => { el.placeholder = lang === 'uz' ? el.dataset.uzPh : (D[lang][el.dataset.i18nPh] ?? el.dataset.uzPh); });
  document.title = t('title');
  const md = $('meta[name=description]'); if (md) md.content = t('desc');
  const btns = $$('.lang button');
  btns.forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
  const on = $('.lang button.on'), pill = $('.lang-pill');
  if (on) { pill.style.width = on.offsetWidth + 'px'; pill.style.transform = `translateX(${on.offsetLeft - 3}px)`; }
  if (save) store.set('lang', lang);
  renderCfgText(); calc();
  document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
}
$$('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

/* ---------- lazy pictures ---------- */
$$('.pic img').forEach(img => {
  const done = () => img.classList.add('ok');
  if (img.complete && img.naturalWidth) done();
  else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
});

/* ---------- nav, progress, dock ---------- */
const nav = $('#nav'), bar = $('#progress'), dock = $('#dock'), hero = $('#top');
let ticking = false;
const par = $$('[data-par]'), slidesEl = $('#slides');
function frame() {
  ticking = false;
  const y = scrollY, h = innerHeight;
  nav.classList.toggle('scrolled', y > 40);
  const max = root.scrollHeight - h;
  bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  dock.classList.toggle('show', y > h * .7);
  if (!reduce) {
    if (y < h * 1.1) slidesEl.style.transform = `translate3d(0,${(y * .28).toFixed(1)}px,0)`;
    par.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > h + 100) return;
      const c = (r.top + r.height / 2 - h / 2) * parseFloat(el.dataset.par);
      el.style.transform = `translate3d(0,${c.toFixed(1)}px,0)`;
    });
  }
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
addEventListener('resize', () => { frame(); const on = $('.lang button.on'), pill = $('.lang-pill'); if (on) { pill.style.width = on.offsetWidth + 'px'; pill.style.transform = `translateX(${on.offsetLeft - 3}px)`; } });
$('#burger').addEventListener('click', () => { const o = nav.classList.toggle('open'); $('#burger').setAttribute('aria-expanded', o); });
$$('#menu a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

const links = $$('#menu a');
const secIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(a => a.classList.toggle('act', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => secIO.observe(s));

/* ---------- reveal, counters ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target;
  el.classList.add('in');
  setTimeout(() => el.classList.add('rvd'), 1400);
  io.unobserve(el);
}), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
$$('.rv').forEach(el => io.observe(el));

const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  cio.unobserve(e.target);
  const to = +e.target.dataset.count;
  if (reduce) return;
  const t0 = performance.now(), dur = 1600;
  const step = n => {
    const p = Math.min(1, (n - t0) / dur), v = 1 - Math.pow(1 - p, 4);
    e.target.textContent = Math.round(to * v);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}), { threshold: .6 });
$$('.count').forEach(el => cio.observe(el));

/* ---------- hero slideshow ---------- */
const slides = $$('.slide'), dots = $$('#dots i');
let si = 0, timer;
function go(n) {
  slides[si].classList.remove('on'); dots[si].classList.remove('on');
  si = (n + slides.length) % slides.length;
  slides[si].classList.add('on'); dots[si].classList.add('on');
}
const run = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => go(si + 1), 6000); };
dots.forEach((d, i) => d.addEventListener('click', () => { go(i); run(); }));
document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(timer) : run());

/* ---------- pointer effects ---------- */
if (fine && !reduce) {
  $$('.card, .glow').forEach(el => {
    let raf = 0;
    el.addEventListener('pointermove', e => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        el.style.setProperty('--mx', x + 'px'); el.style.setProperty('--my', y + 'px');
        if (el.classList.contains('card')) el.style.transform = `perspective(1000px) rotateX(${((.5 - y / r.height) * 6).toFixed(2)}deg) rotateY(${((x / r.width - .5) * 8).toFixed(2)}deg) translateY(-6px)`;
      });
    });
    el.addEventListener('pointerleave', () => { if (el.classList.contains('card')) el.style.transform = ''; });
  });
  $$('.magnet').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * .18).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * .3).toFixed(1)}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

/* ---------- configurator ---------- */
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const shade = (h, p) => toHex(hex(h).map(v => p < 0 ? v * (1 + p) : v + (255 - v) * p));
const FRAME = [['black', '#151a17'], ['white', '#f1efe9'], ['wenge', '#3b2217'], ['walnut', '#74502e']];
const ACCENT = [['gold', '#d6aa42'], ['silver', '#bcc1c5'], ['match', null]];
const LEGC = [['match', null], ['gold', '#d6aa42'], ['white', '#f1efe9'], ['black', '#151a17']];
const CLOTH = [['green', '#17895a'], ['blue', '#1f5fa8'], ['burg', '#8c1f35'], ['grey', '#5e6a73']];
const S = { size: '12', frame: 'black', accent: 'gold', legs: 'turned', legc: 'match', cloth: 'green', slate: 'marble' };
const tbl = $('#tbl');

function leg(g, cx, kind) {
  const f = (x) => cx + x;
  if (kind === 'turned') {
    g.innerHTML = `<path class="b" d="M${f(-24)},312 L${f(24)},312 L${f(15)},332 Q${f(36)},348 ${f(28)},372 L${f(19)},420 L${f(25)},430 L${f(-25)},430 L${f(-19)},420 L${f(-28)},372 Q${f(-36)},348 ${f(-15)},332 Z"/>
    <path class="ov" d="M${f(-24)},312 L${f(24)},312 L${f(15)},332 Q${f(36)},348 ${f(28)},372 L${f(19)},420 L${f(25)},430 L${f(-25)},430 L${f(-19)},420 L${f(-28)},372 Q${f(-36)},348 ${f(-15)},332 Z"/>
    <path class="fl" d="M${f(-10)},345 L${f(-9)},418 M${f(0)},348 L${f(0)},420 M${f(10)},345 L${f(9)},418"/>
    <rect class="foot" x="${f(-26)}" y="430" width="52" height="9" rx="3"/>`;
  } else {
    g.innerHTML = `<path class="b" d="M${f(-26)},312 H${f(26)} V430 H${f(-26)} Z"/>
    <path class="ov" d="M${f(-26)},312 H${f(26)} V430 H${f(-26)} Z"/>
    <path class="fl" d="M${f(-14)},336 V418 M${f(14)},336 V418"/>
    <rect class="foot" x="${f(-30)}" y="430" width="60" height="9" rx="3"/>`;
  }
}
$$('#legsTurned .leg').forEach(g => leg(g, +g.dataset.x, 'turned'));
$$('#legsSquare .leg').forEach(g => leg(g, +g.dataset.x, 'square'));

function swatches(id, list, key, labelKey) {
  const box = $(id);
  box.innerHTML = '';
  list.forEach(([name, col]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.v = name;
    b.style.setProperty('--c', col || 'conic-gradient(#ddd,#999,#ddd)');
    if (!col) b.style.background = 'conic-gradient(from 45deg,#d6aa42,#151a17,#f1efe9,#d6aa42)';
    b.addEventListener('click', () => { S[key] = name; renderCfg(); });
    box.appendChild(b);
  });
}
swatches('#cFrame', FRAME, 'frame'); swatches('#cAccent', ACCENT, 'accent'); swatches('#cLegc', LEGC, 'legc'); swatches('#cCloth', CLOTH, 'cloth');
const bindSeg = (id, key) => $$(id + ' button').forEach(b => b.addEventListener('click', () => { S[key] = b.dataset.v; renderCfg(); }));
bindSeg('#cSize', 'size'); bindSeg('#cLegs', 'legs'); bindSeg('#cSlate', 'slate');

const colName = n => t('col_' + n);
function renderCfgText() {
  $$('#cFrame button').forEach(b => { b.title = b.ariaLabel = colName(b.dataset.v); });
  $$('#cAccent button').forEach(b => { b.title = b.ariaLabel = colName(b.dataset.v); });
  $$('#cLegc button').forEach(b => { b.title = b.ariaLabel = colName(b.dataset.v); });
  $$('#cCloth button').forEach(b => { b.title = b.ariaLabel = colName(b.dataset.v); });
  $('#cfgSum').textContent = cfgSummary();
}
function cfgSummary() {
  return t('cfg_sum', { s: S.size, f: colName(S.frame), a: colName(S.accent), l: t(S.legs), lc: colName(S.legc), c: colName(S.cloth), sl: t(S.slate === 'marble' ? 'sl_m_s' : 'sl_g_s') });
}
function renderCfg() {
  const fr = Object.fromEntries(FRAME)[S.frame];
  const ac = Object.fromEntries(ACCENT)[S.accent] || shade(fr, S.frame === 'white' ? -.12 : .22);
  const lc = Object.fromEntries(LEGC)[S.legc] || fr;
  const cl = Object.fromEntries(CLOTH)[S.cloth];
  const st = tbl.style;
  st.setProperty('--frame', fr); st.setProperty('--frame-d', shade(fr, -.35));
  st.setProperty('--accent', ac); st.setProperty('--leg', lc); st.setProperty('--cloth', cl);
  const turned = S.legs === 'turned';
  const gt = $('#legsTurned'), gs = $('#legsSquare');
  gt.toggleAttribute('hidden', !turned); gs.toggleAttribute('hidden', turned);
  [['#cSize', 'size'], ['#cLegs', 'legs'], ['#cSlate', 'slate']].forEach(([id, k]) => $$(id + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === S[k])));
  [['#cFrame', 'frame'], ['#cAccent', 'accent'], ['#cLegc', 'legc'], ['#cCloth', 'cloth']].forEach(([id, k]) => $$(id + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === S[k])));
  $('#cfgSum').textContent = cfgSummary();
}
renderCfg();
$('#cfgSend').addEventListener('click', () => {
  $('#model').value = 'Custom';
  $('#fm').value = t('cfg_msg', { sum: cfgSummary() });
  $('#contact').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  setTimeout(() => $('#fn').focus({ preventScroll: true }), 700);
});

/* ---------- room calculator (approximate outer table sizes, metres) ---------- */
const T = { 12: [3.85, 1.95], 10: [3.30, 1.73], 9: [2.95, 1.62] };
const MIN = 1.25, COMF = 1.5;
let size = 12;
const fmt = n => n.toFixed(1).replace('.', ',');
function calc() {
  const a = parseFloat($('#rl').value) || 0, b = parseFloat($('#rw').value) || 0;
  const L = Math.max(a, b), W = Math.min(a, b);
  const [tl, tw] = T[size];
  const ml = tl + 2 * MIN, mw = tw + 2 * MIN, cl = tl + 2 * COMF, cw = tw + 2 * COMF;
  let cls, txt;
  if (L >= cl && W >= cw) { cls = 'ok'; txt = t('v_ok', { s: size }); }
  else if (L >= ml && W >= mw) { cls = 'mid'; txt = t('v_mid'); }
  else { cls = 'no'; txt = t('v_no'); }
  const v = $('#verdict'); v.className = 'verdict ' + cls; v.textContent = txt;
  $('#need').innerHTML = t('need', { tl: fmt(tl), tw: fmt(tw), ml: fmt(ml), mw: fmt(mw), cl: fmt(cl), cw: fmt(cw) });
  $('#roomIn').style.aspectRatio = (Math.max(L, 1) / Math.max(W, 1)).toFixed(3);
  const ts = $('#roomTable');
  ts.style.width = Math.min(95, tl / Math.max(L, .1) * 100) + '%';
  ts.style.height = Math.min(95, tw / Math.max(W, .1) * 100) + '%';
  ts.style.borderColor = cls === 'no' ? '#b33' : '#3a2a12';
}
$$('#sizes button').forEach(b => b.addEventListener('click', () => {
  size = +b.dataset.size;
  $$('#sizes button').forEach(x => x.classList.toggle('on', x === b));
  calc();
}));
['rl', 'rw'].forEach(id => $('#' + id).addEventListener('input', calc));

/* ---------- filters ---------- */
function filterGroup(boxSel, itemSel, attr) {
  const box = $(boxSel);
  box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', box).forEach(x => x.classList.toggle('on', x === b));
    const f = b.dataset.f;
    $$(itemSel).forEach(el => {
      const show = f === 'all' || el.dataset[attr] === f;
      el.hidden = !show;
      if (show) { el.classList.add('in', 'rvd'); }
    });
  });
}
filterGroup('#gFilters', '#gal .g', 'cat');

/* ---------- gallery lightbox (follows the current filter) ---------- */
const lb = $('#lb'), lbImg = $('#lbImg'), lbC = $('#lbC');
let list = [], li = 0;
const biggest = img => { const c = img.getAttribute('srcset').split(',').map(x => x.trim().split(' ')[0]); return c[c.length - 1]; };
function show(i) {
  li = (i + list.length) % list.length;
  lbImg.style.opacity = 0;
  lbImg.onload = () => { lbImg.style.opacity = 1; };
  lbImg.src = list[li].src; lbImg.alt = list[li].alt;
  lbC.textContent = `${li + 1} / ${list.length}`;
  lb.classList.add('on'); document.body.style.overflow = 'hidden';
  [1, -1].forEach(d => { new Image().src = list[(li + d + list.length) % list.length].src; });
}
const close = () => { lb.classList.remove('on'); document.body.style.overflow = ''; };
$$('#gal .g').forEach(g => g.addEventListener('click', () => {
  const vis = $$('#gal .g').filter(x => !x.hidden);
  list = vis.map(x => { const im = $('img', x); return { src: biggest(im), alt: im.alt }; });
  show(vis.indexOf(g));
}));
$('.lb-x').addEventListener('click', close);
$('.lb-p').addEventListener('click', e => { e.stopPropagation(); show(li - 1); });
$('.lb-n').addEventListener('click', e => { e.stopPropagation(); show(li + 1); });
lb.addEventListener('click', e => { if (e.target === lb) close(); });
addEventListener('keydown', e => {
  if (!lb.classList.contains('on')) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowLeft') show(li - 1);
  if (e.key === 'ArrowRight') show(li + 1);
});
let sx = 0;
lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(li + (dx < 0 ? 1 : -1)); }, { passive: true });

/* ---------- contact ---------- */
$('#copy').addEventListener('click', async e => {
  const b = e.currentTarget, old = b.innerHTML;
  try { await navigator.clipboard.writeText('+998888885582'); b.textContent = '✓'; } catch (err) { b.textContent = '+998888885582'; }
  setTimeout(() => { b.innerHTML = old; }, 1800);
});
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const model = f.get('model') === 'Custom' ? t('k_other') : f.get('model');
  const text = t('msg', { name: f.get('name'), phone: f.get('phone'), model, msg: f.get('msg') || '-' });
  const url = 'https://t.me/+998888885582?text=' + encodeURIComponent(text);
  window.__open(url);
});
$('#yr').textContent = new Date().getFullYear();

/* ---------- start ---------- */
const q = new URLSearchParams(location.search).get('lang');
const nl = (navigator.language || 'uz').slice(0, 2);
const first = [q, store.get('lang'), nl === 'ru' ? 'ru' : nl === 'en' ? 'en' : 'uz'].find(x => x && D[x]);
setLang(first, false);
frame(); run();
const start = () => { document.body.classList.remove('loading'); };
const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
Promise.race([fontsReady, new Promise(r => setTimeout(r, 900))]).then(() => setTimeout(start, 350));
setTimeout(start, 1500);
})();
