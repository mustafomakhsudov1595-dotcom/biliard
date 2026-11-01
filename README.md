# Bilyard Ishlab Chiqarish — sayt + Telegram bot

Statik sayt (`index.html`, `css/`, `js/`, `data/products.json`) va Cloudflare Worker (`worker.js`).
`css/enhance.css` — dizaynni kuchaytirish qatlami.

## Worker nima qiladi
- `POST /api/lead` — saytdagi aloqa formasi va savatdagi buyurtmani Telegram'dagi `CHAT_ID` ga yuboradi.
  Telefon tekshiriladi, spam tuzog'i va tezlik cheklovi bor, Mini App ichida Telegram imzosi tekshiriladi.
- `POST /api/tg/<WEBHOOK_SECRET>` — bot: `/start`, `/catalog`, `/prices`, `/contact`; oddiy xabarni egasiga yo'naltiradi.
- `GET /api/setup/<WEBHOOK_SECRET>` — bir marta ochiladi: webhook, buyruqlar va menyu tugmasini o'rnatadi.
- Worker sozlanmagan bo'lsa, sayt avvalgidek Telegram havolasini ochadi (zaxira).

## Sozlash (bir marta)
1. Telegram'da **@BotFather** → `/newbot` → **token** oling.
2. Buyurtmalar keladigan chat ID: o'zingiz uchun **@userinfobot** ga `/start` yozing — `Id` raqamini oladi.
   (Guruhga kelsin desangiz, botni guruhga qo'shing; guruh ID si `-100...` bilan boshlanadi.) Botga o'zingiz ham `/start` bosib qo'ying.
3. Cloudflare → Workers & Pages → **biliard** → **Settings → Variables and Secrets** → **Add** (turi **Secret**):
   - `BOT_TOKEN` — BotFather tokeni
   - `CHAT_ID` — 2-qadamdagi raqam
   - `WEBHOOK_SECRET` — o'zingiz o'ylab topgan uzun tasodifiy matn (faqat harf/raqam)
   **Deploy** bosing.
4. Brauzerda oching: `https://<sayt-manzili>/api/setup/<WEBHOOK_SECRET>` — `"ok":true` chiqsa, bot tayyor.
5. Botga `/start` yozing, saytdan formani yuboring — xabar Telegram'ga tushadi.

Token va secret hech qachon kodga yoki GitHub'ga yozilmaydi.
