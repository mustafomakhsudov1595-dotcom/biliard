// Cloudflare Worker: buyurtmalarni Telegram botga yuboradi va bot buyruqlariga javob beradi.
// Maxfiy qiymatlar (Cloudflare → Settings → Variables and Secrets):
//   BOT_TOKEN       — @BotFather bergan token (Secret)
//   CHAT_ID         — buyurtmalar keladigan chat/guruh ID (Secret yoki Text)
//   WEBHOOK_SECRET  — o'zingiz o'ylab topgan uzun tasodifiy so'z (Secret)

const TG = t => `https://api.telegram.org/bot${t}`;
const MAX = { name: 80, phone: 40, text: 1500 };
const hits = new Map(); // oddiy tezlik cheklovi (har instansiyada)

const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const clip = (s, n) => String(s ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);

async function tg(env, method, body) {
  const r = await fetch(`${TG(env.BOT_TOKEN)}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return r.json().catch(() => ({ ok: false }));
}

// Telegram Mini App initData imzosini tekshirish (foydalanuvchi shaxsini ishonchli aniqlash uchun)
async function verifyInitData(initData, token) {
  try {
    const p = new URLSearchParams(initData), hash = p.get('hash');
    if (!hash) return null;
    p.delete('hash');
    const data = [...p.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n');
    const enc = new TextEncoder();
    const hm = async (key, msg) => crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), msg);
    const secret = await hm(enc.encode('WebAppData'), enc.encode(token));
    const sig = new Uint8Array(await hm(secret, enc.encode(data)));
    const hex = [...sig].map(b => b.toString(16).padStart(2, '0')).join('');
    if (hex !== hash) return null;
    if (Date.now() / 1000 - Number(p.get('auth_date') || 0) > 86400) return null;
    return JSON.parse(p.get('user') || 'null');
  } catch { return null; }
}

async function handleLead(req, env) {
  if (!env.BOT_TOKEN || !env.CHAT_ID) return json({ ok: false, error: 'not_configured' }, 503);
  const ip = req.headers.get('cf-connecting-ip') || 'x', now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (arr.length >= 5) return json({ ok: false, error: 'rate' }, 429);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 500) hits.clear();

  let b; try { b = await req.json(); } catch { return json({ ok: false }, 400); }
  if (b.hp) return json({ ok: true }); // spam tuzog'i
  const name = clip(b.name, MAX.name), phone = clip(b.phone, MAX.phone), text = clip(b.text, MAX.text);
  const digits = phone.replace(/\D/g, '');
  const isTgHandle = /^@?[A-Za-z0-9_]{5,32}$/.test(phone);
  if (!name || (!isTgHandle && (digits.length < 9 || digits.length > 15))) return json({ ok: false, error: 'invalid' }, 400);

  const kind = { cart: '🛒 Yangi buyurtma (savat)', contact: '✉️ Yangi so‘rov (forma)' }[b.type] || '✉️ Yangi so‘rov';
  const id = 'B' + now.toString(36).toUpperCase().slice(-6);
  let who = '';
  if (b.initData) {
    const u = await verifyInitData(String(b.initData), env.BOT_TOKEN);
    if (u) who = `\n👤 Telegram: ${u.username ? '@' + esc(u.username) : esc(u.first_name || '')} (id ${u.id})`;
  }
  const msg = `<b>${kind}</b> · <code>${id}</code>\n\n<b>Ism:</b> ${esc(name)}\n<b>Aloqa:</b> ${esc(phone)}${who}\n<b>Til:</b> ${esc(clip(b.lang, 5))}\n\n${esc(text)}`;
  const r = await tg(env, 'sendMessage', { chat_id: env.CHAT_ID, text: msg, parse_mode: 'HTML', disable_web_page_preview: true });
  if (!r.ok) return json({ ok: false, error: 'telegram' }, 502);
  return json({ ok: true, id });
}

const T = {
  uz: { hi: 'Assalomu alaykum! 🎱 Samarqanddagi bilyard va snooker stollari ishlab chiqaruvchisi botiga xush kelibsiz.', open: '🎱 Saytni ochish', cat: 'Katalog', price: 'Narxlar', contact: 'Aloqa' },
};
function helpText(site) {
  return `${T.uz.hi}\n\n/catalog — katalog\n/prices — narxlar\n/contact — aloqa\n\n${site}`;
}

async function handleUpdate(upd, env, site) {
  const m = upd.message; if (!m || !m.text) return;
  const cmd = m.text.split(/[\s@]/)[0].toLowerCase();
  const chat = m.chat.id;
  const send = (text, extra = {}) => tg(env, 'sendMessage', { chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });
  const openBtn = (label, path = '') => ({ reply_markup: { inline_keyboard: [[{ text: label, web_app: { url: site + path } }]] } });
  switch (cmd) {
    case '/start': case '/help':
      return send(helpText(site), openBtn(T.uz.open));
    case '/catalog':
      return send('📚 <b>Katalog</b>\nStollar, sharlar, kiyalar va aksessuarlar:', openBtn(T.uz.cat, '#catalog'));
    case '/prices':
      return send('💰 <b>Narxlar</b>\nDizayn stollari: ~$1 800 – $3 000\nSlanetsli stollar: ~$3 400 – $5 000\nYakuniy narx telefon orqali kelishiladi.', openBtn(T.uz.price, '#prices'));
    case '/contact':
      return send('📞 <b>Aloqa</b>\nTelefon: +998 88 888 55 82\nTelegram: https://t.me/+998888885582\nSamarqand, O‘zbekiston', openBtn(T.uz.contact, '#contact'));
    default:
      // Boshqa matn kelsa — egasiga yo'naltiramiz
      if (String(chat) !== String(env.CHAT_ID) && !m.text.startsWith('/')) {
        const u = m.from || {};
        await tg(env, 'sendMessage', { chat_id: env.CHAT_ID, parse_mode: 'HTML', text: `💬 <b>Botga xabar</b>\n${u.username ? '@' + esc(u.username) : esc(u.first_name || '')} (id ${u.id})\n\n${esc(clip(m.text, 1500))}` });
        return send('Xabaringiz qabul qilindi, tez orada javob beramiz. Katalog uchun /catalog');
      }
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname;
    const site = url.origin;

    if (p === '/api/lead' && req.method === 'POST') return handleLead(req, env);

    // Telegram webhook: /api/tg/<WEBHOOK_SECRET>
    if (p.startsWith('/api/tg/') && req.method === 'POST') {
      if (!env.WEBHOOK_SECRET || p.slice(8) !== env.WEBHOOK_SECRET || !env.BOT_TOKEN) return json({ ok: false }, 403);
      try { await handleUpdate(await req.json(), env, site); } catch (e) { /* Telegram qayta yubormasin */ }
      return json({ ok: true });
    }

    // Bir marta ochiladigan sozlash havolasi: /api/setup/<WEBHOOK_SECRET>
    if (p.startsWith('/api/setup/') && req.method === 'GET') {
      if (!env.WEBHOOK_SECRET || p.slice(11) !== env.WEBHOOK_SECRET || !env.BOT_TOKEN) return json({ ok: false }, 403);
      const out = {};
      out.webhook = await tg(env, 'setWebhook', { url: `${site}/api/tg/${env.WEBHOOK_SECRET}`, allowed_updates: ['message'], drop_pending_updates: true });
      out.commands = await tg(env, 'setMyCommands', { commands: [
        { command: 'start', description: 'Boshlash' }, { command: 'catalog', description: 'Katalog' },
        { command: 'prices', description: 'Narxlar' }, { command: 'contact', description: 'Aloqa' }] });
      out.menu = await tg(env, 'setChatMenuButton', { menu_button: { type: 'web_app', text: '🎱 Sayt', web_app: { url: site } } });
      return json(out);
    }

    if (p.startsWith('/api/')) return json({ ok: false, error: 'not_found' }, 404);
    return env.ASSETS.fetch(req);
  }
};
