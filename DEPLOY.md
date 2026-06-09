# Деплой strimkraft (бесплатно)

Код: https://github.com/leshapudge/strimkraft

## Вариант A — Render (рекомендуется, БД включена)

1. Открой: **https://render.com/deploy?repo=https://github.com/leshapudge/strimkraft**
2. Войди через **GitHub** → подтверди доступ к репо.
3. Render подхватит `render.yaml` (Web + PostgreSQL).
4. Заполни переменные с `sync: false`:
   - `AUTH_URL` — URL сервиса после деплоя, например `https://strimkraft.onrender.com`
   - `AUTH_TWITCH_ID` / `AUTH_TWITCH_SECRET`
   - `STREAMER_TWITCH_LOGINS`, `ADMIN_TWITCH_*`
   - `RAWG_API_KEY`, `TWITCH_CLIENT_*` (можно те же, что Twitch OAuth)
5. **Apply** → дождись билда (~5–10 мин).
6. В [Twitch Dev Console](https://dev.twitch.tv/console/apps) добавь redirect:
   ```
   https://ТВОЙ-URL.onrender.com/api/auth/callback/twitch
   ```

Проверка: `https://ТВОЙ-URL.onrender.com/api/health`

## Вариант B — Vercel + Neon

1. База: [neon.tech](https://neon.tech) → New Project → скопируй `DATABASE_URL`.
2. Локально один раз:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma db push
   DATABASE_URL="postgresql://..." npm run db:seed
   ```
3. Vercel: **https://vercel.com/new/import?s=https://github.com/leshapudge/strimkraft**
4. Environment Variables (см. `.env.example`), `AUTH_URL` = `https://xxx.vercel.app`.
5. Deploy → обнови Twitch redirect URL.

Секреты для GitHub Actions уже в репо (Settings → Secrets). Для Vercel CI добавь:
`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL`.

## После деплоя

- Главная: `/`
- Стримеры: `/streamer` (логин Twitch)
- Админка: `/admin`
