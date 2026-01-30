# DnD Digital Desk

Вспомогательная утилита для ведения DnD‑сессий. Проект состоит из Django API и фронтенда на Bun + React.

## Быстрый старт (Docker)

1) Подготовьте переменные окружения:

```bash
cp backend/.env.example backend/.env
cp fronend/.env.example fronend/.env
```

2) Запуск (по умолчанию без локальной БД, можно использовать удаленный Postgres):

```bash
docker compose build
docker compose up
```

3) Запуск с локальной PostgreSQL (опционально):

```bash
docker compose --profile localdb up
```

## Переменные окружения (backend)

Минимальный набор для продакшена:

- `DJANGO_SECRET_KEY` — обязательно, если `DJANGO_DEBUG=false`
- `DJANGO_ALLOWED_HOSTS` — список через запятую
- `CORS_ALLOWED_ORIGINS` — список через запятую
- `DATABASE_URL` **или** `DB_HOST/DB_NAME/DB_USER/DB_PASSWORD/DB_PORT`

Пример — в `backend/.env.example`.

### Демо-настройки

Для быстрого демо можно включить:

- `CREATE_SUPERUSER=true` + `DJANGO_SUPERUSER_*`
- `SEED_DEMO_DATA=true`

По умолчанию в `.env` заданы:
- логин: `admin`
- пароль: `admin12345`

## Переменные окружения (frontend)

- `VITE_API_URL` — базовый URL API, например `http://localhost:8000/api`

Пример — в `fronend/.env.example`.

## Локальная разработка (без Docker)

Backend:

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Frontend:

```bash
cd fronend
bun install
bun dev
```

## Деплой (Dokploy)

- Используйте `docker-compose.yml`.
- На хосте задайте переменные окружения как в `.env.example`.
- Для удаленной PostgreSQL задайте `DATABASE_URL` или `DB_*` параметры.
- Для домена используйте `docker-compose.dokploy.yml` и переменную `DOKPLOY_DOMAIN`.

## API эндпоинты (basic CRUD)

Все маршруты ниже требуют JWT (кроме регистрации/логина).

- `POST /api/accounts/register/`
- `POST /api/accounts/login/`
- `POST /api/accounts/token/refresh/`
- `GET /api/accounts/campaigns/`
- `POST /api/accounts/campaigns/`
- `GET /api/accounts/sessions/`
- `POST /api/accounts/sessions/`
- `GET /api/accounts/dm-notes/`
- `POST /api/accounts/dm-notes/`
