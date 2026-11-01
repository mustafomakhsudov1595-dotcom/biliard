#!/bin/sh
# Deploy paytida Builds'dagi secret'larni Worker'ning o'ziga ko'chiradi.
set -e
npx wrangler deploy
for n in BOT_TOKEN CHAT_ID WEBHOOK_SECRET; do
  v=$(printenv "$n" || true)
  if [ -n "$v" ]; then printf %s "$v" | npx wrangler secret put "$n"; else echo "OGOHLANTIRISH: $n topilmadi"; fi
done
