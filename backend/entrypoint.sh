#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

if [ "${CREATE_SUPERUSER}" = "true" ]; then
  python manage.py ensure_superuser
fi

if [ "${SEED_DEMO_DATA}" = "true" ]; then
  python manage.py seed_demo
fi

exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${GUNICORN_WORKERS:-3}" \
  --timeout "${GUNICORN_TIMEOUT:-120}"
