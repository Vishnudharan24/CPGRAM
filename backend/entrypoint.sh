#!/bin/sh
set -e

alembic upgrade head
python -m app.services.seed_mock_data
uvicorn app.main:app --host 0.0.0.0 --port 8000
