# CPGRAMS Guided Grievance Router

A hackathon prototype for a guided grievance intake and tracking layer inspired by CPGRAMS. It uses only mock and synthetic data. No live CPGRAMS or pgportal.gov.in system is touched.

## What Works

- Guided intake with explainable complaint / grievance / suggestion classification.
- Synthetic ministry -> department -> district routing trail.
- 21-day resolution SLA and 30-day appeal window logic.
- ATR quality checks that flag short or templated closure reports.
- Citizen dashboard, grievance detail view, and demo officer console.
- Docker Compose topology: PostgreSQL, FastAPI, and Nginx serving the built React app.

## Run

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost`.

Demo accounts seeded on startup:

| Role | Email | Password |
|---|---|---|
| Citizen | ananya@example.com | password |
| Citizen | rahul@example.com | password |
| Officer | officer@example.com | password |
| Admin | admin@example.com | password |

For local backend development without Docker, set `DATABASE_URL` and run:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Honesty Note

Real in this prototype: classification rules, routing simulation, SLA windows, ATR quality checks, DB-backed lifecycle, and role-aware API behavior.

Mocked: authentication identity, departments/officers, grievance content, notifications, and all CPGRAMS integration.
