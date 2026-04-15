# Деплой на Render (сайт + API + бот в одном сервисе)

## 1. Подготовка репозитория

1. Залей папку `cycle-site` в GitHub как отдельный репозиторий.
2. Проверь, что в корне есть `render.yaml`.

## 2. Куда нажимать в Render

1. Открой `dashboard.render.com`.
2. Нажми `New` -> `Blueprint`.
3. Выбери GitHub-репозиторий с проектом.
4. Render увидит `render.yaml`, нажми `Apply`.
5. В форме переменных задай:
   - `PUBLIC_BASE_URL` = `https://<имя-сервиса>.onrender.com`
   - `WEB_APP_URL` = `https://<имя-сервиса>.onrender.com`
   - `TG_BOT_TOKEN` = токен из BotFather
   - `TG_ADMIN_IDS` = твой Telegram ID (например: `123456789`)
6. Нажми `Create New Resources`.
7. Дождись статуса `Live`.

## 3. Подключение Mini App в BotFather

1. `@BotFather` -> твой бот `@cycleAdmin_bot`.
2. `Mini Apps` -> `Create New App`.
3. `Web App URL` = `https://<имя-сервиса>.onrender.com`
4. `Bot Settings` -> `Menu Button` -> `Configure Menu Button`.
5. Текст: `Открыть mini app`, URL: тот же.

## 4. Проверка

1. Открой `https://<имя-сервиса>.onrender.com/api/health` -> должно вернуть `{"ok":true}`.
2. В `@cycleAdmin_bot` отправь тестовый пост.
3. Нажми `Залить на сайт`.
4. Открой mini app и проверь карточку.

## Важно

- На бесплатном плане Render сервис "засыпает" через 15 минут без трафика и просыпается около минуты.
- Файлы на локальном диске бесплатного сервиса не постоянные (фото могут пропадать после перезапуска).
- Для стабильной работы бота и фото лучше платный инстанс + persistent disk или внешнее хранилище (S3/Cloudinary).
