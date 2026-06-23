# PODNASRAL

Платформа для 14-дневного стримингового ивента. Стримеры соревнуются за очки через аукционы игр, прохождение по HLTB, лут, крафт и мирового босса.

## Стек

- Next.js 15, React 19, TypeScript, Tailwind 4
- PostgreSQL + Prisma 6
- NextAuth (вход через Twitch)

## Деплой

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/leshapudge/podnasral)

Подробная инструкция: [DEPLOY.md](./DEPLOY.md)

## Локальный запуск

```bash
cp .env.example .env
# Заполни DATABASE_URL, AUTH_SECRET, Twitch-ключи

npm install
npx prisma db push
npm run db:seed
npm run dev
```

Открой http://localhost:3000

## Основные страницы

| Путь | Назначение |
|------|------------|
| `/` | Дашборд для зрителей (все стримеры) |
| `/streamer` | Панель стримера (аукцион, сессия, крафт) |
| `/admin` | Админка ивента |
| `/auk` | Очередь аукциона от донатов |
| `/api/v1/*` | REST API |
| `/api/v1/live` | SSE-обновления в реальном времени |

## API

Формат ответа: `{ success: true, data, meta? }` или `{ success: false, error }`.

### Инфраструктура

| Метод | Путь | Авторизация |
|-------|------|-------------|
| GET | `/api/health` | — |
| GET | `/api/auth/me` | сессия |
| GET | `/api/v1/me` | сессия (профиль стримера) |
| POST | `/api/integrations/donationalerts` | `x-donationalerts-secret` |
| POST | `/api/integrations/donationalerts/:webhookKey` | персональный ключ стримера |

### DonationAlerts

- Каждый стример получает свой webhook URL в панели стримера.
- URL вида `/api/integrations/donationalerts/:webhookKey` привязан к участнику.
- Донаты автоматически записываются и могут добавить игру в пул аукциона.

### Публичные эндпоинты

`GET /api/v1/event`, `/leaderboard`, `/boss`, `/feed`, `/live` (SSE), `/participants/:id`, `/games/search?q=`, `/catalog-games`, `/items`, `/craft-recipes`

### Флоу стримера

`POST /auctions` → `modifiers` → `start` → `sessions/:id/roll-difficulty` → `confirm` → `pause` / `resume` → `complete` / `drop`

### Админ CRUD

| Ресурс | Путь |
|--------|------|
| Пользователи | `/api/v1/users` |
| Ивенты | `/api/v1/events` |
| Участники | `/api/v1/participants` |
| Каталог игр | `/api/v1/catalog-games` |
| Предметы | `/api/v1/items` |
| Рецепты крафта | `/api/v1/craft-recipes` |
| Ингредиенты | `/api/v1/craft-ingredients` |
| Боссы | `/api/v1/bosses` |
| Игровые сессии | `/api/v1/game-sessions` |
| Лог активности | `/api/v1/activity-logs` |
| Статистика | `/api/v1/admin/stats` |

### Клиент

```ts
import { api, connectLive } from "@/lib/api/client";

const event = await api.getEvent();
connectLive((e) => console.log(e.type));
```

## Переменные окружения

См. [`.env.example`](./.env.example). Минимум для работы:

- `DATABASE_URL` — PostgreSQL
- `AUTH_SECRET` — секрет сессий
- `AUTH_URL` / `APP_BASE_URL` — публичный URL приложения
- `AUTH_TWITCH_ID` / `AUTH_TWITCH_SECRET` — OAuth Twitch
- `RAWG_API_KEY` — поиск игр в аукционе

## Git: коммиты от leshapudge

Чтобы в GitHub в Contributors был только аккаунт **leshapudge**, в этом репозитории укажи авторство и хук (один раз):

```bash
git config user.name "leshapudge"
git config user.email "206715166+leshapudge@users.noreply.github.com"
git config core.hooksPath .githooks
```

Email `lesha.ba196@gmail.com` привязан к другому аккаунту — GitHub засчитывает коммиты туда, если писать с него.
