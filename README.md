# Cycle Site + Telegram Admin Bot

В проект добавлены:

- фронтенд mini app (`Vite + React`);
- backend API для карточек (`/api/products`);
- Telegram-бот для загрузки карточек с подтверждением.

## 1) Установка

```bash
npm install
```

## 2) Переменные окружения

Скопируй `.env.example` в `.env` и заполни:

```env
PORT=3001
PUBLIC_BASE_URL=http://localhost:3001
WEB_APP_URL=http://localhost:5173
TG_BOT_TOKEN=...
TG_ADMIN_IDS=123456789
API_KEY=
VITE_API_BASE_URL=http://localhost:3001
```

## 3) Запуск

В двух терминалах:

```bash
npm run dev
```

```bash
npm run server
```

Сайт: `http://localhost:5173`  
API: `http://localhost:3001/api/products`

## 4) Логика бота

1. Пересылаешь пост (или отправляешь текст/фото) в `@cycleAdmin_bot`.
2. Бот парсит поля карточки:
   - название;
   - описание;
   - цитату;
   - размер;
   - цену;
   - категорию.
3. Бот присылает превью и кнопки:
   - `Залить на сайт`;
   - `Отменить`;
   - `Открыть mini app`.
4. После подтверждения карточка попадает в `data/products.json` и отображается на сайте.

## 5) Настройка mini app в BotFather

Для твоего бота `@cycleAdmin_bot`:

1. `/mybots` -> выбрать бота.
2. `Bot Settings` -> `Menu Button` -> `Configure menu button`.
3. Указать текст: `Открыть mini app`.
4. Указать URL: значение `WEB_APP_URL` (обязательно HTTPS в проде).

Опционально:

- `/setcommands` и добавить:
  - `start - открыть меню`
  - `id - показать telegram id`

## Важное по продакшену

- Для Telegram Web App нужен публичный `https` URL.
- Если бот сохраняет фото, `PUBLIC_BASE_URL` должен быть доступен извне (чтобы фронт видел `/uploads/...`).
