# MINESEASON Audio Assets

Ванильные звуки Minecraft (1.21.4), скачанные из `assets.mcasset.cloud`.

## Обновить звуки

```bash
npm run audio:fetch
```

## Структура

```
audio/
├── ui/           — click, hover, page-open, craft, chest-open, level-up, legendary
├── resources/    — wood, stone, iron, gold, diamond, emerald
├── artifacts/    — epic pickup
├── achievements/ — unlock, secret
├── bosses/       — victory, attack
├── ambient/      — wind, cave, footsteps, torch, water, wood-creak, night-*, season-*
└── eastereggs/   — explosion, creeper-hiss, herobrine, enderman, secret-page
```

Формат: **OGG**. Пути заданы в `src/lib/audio/sound-registry.ts`.

Если файл отсутствует, движок использует процедурный fallback (Web Audio API).

## UI-звуки

Все кнопки OS (`mc-os-btn`, табы, меню «Пуск», окно и обычные `<button>`) проигрывают `ui.click` / `ui.hover` через `OsUiAudio`.

Отключить для элемента: `data-silent` или проп `silent` на shadcn `Button`.

Настройки: `/settings`
