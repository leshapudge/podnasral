# Деплой podnasral (бесплатно)

Репозиторий: https://github.com/leshapudge/podnasral

## Render (рекомендуется)

1. Открой: **https://render.com/deploy?repo=https://github.com/leshapudge/podnasral**
2. Войди через **GitHub** и подтверди доступ к репозиторию.
3. Render подхватит `render.yaml` (Web-сервис + PostgreSQL).
4. Заполни переменные с `sync: false`:
   - `AUTH_URL` — URL после деплоя, например `https://podnasral.onrender.com`
   - `APP_BASE_URL` — тот же URL
   - `AUTH_TWITCH_ID` / `AUTH_TWITCH_SECRET`
   - `STREAMER_TWITCH_LOGINS`, `ADMIN_TWITCH_*`
   - `RAWG_API_KEY`, `TWITCH_CLIENT_*` (можно те же, что для OAuth)
5. Нажми **Apply** и дождись билда (~5–10 мин).
6. В [Twitch Dev Console](https://dev.twitch.tv/console/apps) добавь redirect:
   ```
   https://ТВОЙ-URL.onrender.com/api/auth/callback/twitch
   ```

Проверка: `https://ТВОЙ-URL.onrender.com/api/health`

## После деплоя

- Главная: `/`
- Стримеры: `/streamer` (вход через Twitch)
- Админка: `/admin`
