# Plan.md — CPGRAMS Guided Grievance Router
### Build What Moves India — Hackathon Build Plan
### Team size: 5 | Deadline: Aug 27, 2026 | Finale: Sep 12, 2026

---

## 0. TL;DR

CPGRAMS is India's single national portal for filing grievances against any Central Government (and most State) department. Its promise — "one front door for every grievance" — is exactly right, but the actual citizen experience breaks down at a few well-documented points: complaints get **misclassified** (a serious complaint quietly becomes a "suggestion"), grievances get **routed through multiple layers** (ministry → department → district) with no visibility into where the file actually sits, closures are sometimes **vague/templated** despite the Action Taken Report (ATR) requirement, and citizens routinely **miss the 30-day appeal window** because it only unlocks after they rate a resolution "Poor" — a step most people don't know they need to take.

We are building a **guided grievance intake and tracking layer** that:

1. Helps a citizen describe their problem in plain language and **classifies it correctly** (complaint vs. grievance vs. suggestion) instead of leaving it to a dropdown the citizen may pick wrong.
2. Shows a **transparent routing trail** — which office/officer currently holds the file, at every hop — instead of a single opaque status label.
3. **Enforces a substantive Action Taken Report** before a grievance can be closed, and flags generic/templated closures.
4. Proactively surfaces the **21-day resolution deadline** and the **30-day appeal window**, and reminds the citizen when the "Poor" rating is what unlocks their right to appeal — rather than expecting them to know this.

Everything runs on **mock/synthetic data only** — no live CPGRAMS/pgportal.gov.in system is touched, per the hackathon rules.

---

## 1. Problem Recap (context for engineering decisions)

| Stage of a real CPGRAMS grievance | What's supposed to happen | What's broken |
|---|---|---|
| **Filing** | Citizen files a grievance, selecting a category and department | No guided classification — "complaint," "grievance," and "suggestion" get confused, and departments sometimes reclassify a real complaint as a mere "suggestion" to avoid acting on it |
| **Routing** | CPGRAMS marks the grievance to a ministry/department, which forwards it to the actual responsible office (often district-level) | Multi-layer routing dilutes context and adds delay; citizen has no visibility into which hop the file is currently at |
| **Resolution** | Grievance Officer (GO) investigates and files an Action Taken Report (ATR) before closing | ATRs are sometimes vague/templated; average disposal is close to the 21-day target but tens of thousands of cases run past it, some by 90+ days |
| **Closure & feedback** | Citizen rates the resolution; a "Poor" rating unlocks the appeal option | Most citizens don't realize rating matters, or don't know a "Poor" rating is what opens the 30-day appeal window — so a bad resolution just silently stands |
| **Appeal** | Nodal Appellate Authority (NAA), a senior officer, reviews the appeal within 30 days | Independent of the original GO, but citizens frequently miss the 30-day filing window entirely because there's no proactive reminder |

**Root cause we're targeting:** the *citizen* is currently responsible for classifying their own issue correctly, tracking where it is, watching two separate deadlines (21-day resolution, 30-day appeal), and knowing that the "Poor" rating is a hidden trigger. We move all of that from the citizen's memory into the system.

---

## 2. Scope Decisions (what we build vs. fake)

**Real / functional (backed by our own DB and logic):**
- Guided intake with real classification logic (complaint / grievance / suggestion)
- Unified grievance record with a visible multi-hop routing trail
- ATR quality check (a lightweight rule/LLM check flagging suspiciously short or templated ATRs before allowing closure)
- Deadline/SLA engine (21-day resolution window, 30-day appeal window) with proactive flags
- Citizen dashboard showing status, routing history, and time remaining
- Officer console (mock) to simulate a Grievance Officer or Nodal Appellate Authority acting on a case, for the demo
- In-app notifications (email is stretch goal)

**Mocked / synthetic (explicitly disclosed in the write-up):**
- No real pgportal.gov.in/CPGRAMS integration — departments and officers are our own seeded synthetic data
- No real Aadhaar/OTP/government SSO — citizen auth is a simple mock login
- Officer-side responses (ATRs, appeal decisions) are either seeded or triggered manually by a teammate playing "the officer" during the demo

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Backend | FastAPI (Python 3.12) |
| Database | PostgreSQL 16 |
| ORM / Migrations | SQLAlchemy 2.0 + Alembic |
| Frontend | React (Vite) + JavaScript (`.jsx`) |
| Reverse proxy | Nginx |
| Containerization | Docker + Docker Compose |
| Auth | JWT (mock auth — citizen / officer / admin roles) |
| Background jobs (SLA checks) | APScheduler inside FastAPI |

### Container topology

```
┌─────────────────────────────────────────────┐
│                   nginx                      │  :80
│  - serves built React static files (.jsx)    │
│  - reverse-proxies /api/* → fastapi:8000     │
└──────────────┬────────────────────────────────┘
               │
   ┌───────────┴───────────┐
   │                        │
┌──▼─────────┐      ┌───────▼────────┐
│   react    │      │    fastapi      │  :8000
│ (build     │      │  - REST API     │
│  stage,    │      │  - classifier   │
│  output    │      │  - SLA engine   │
│  copied    │      └───────┬─────────┘
│  into      │              │
│  nginx)    │      ┌───────▼─────────┐
└────────────┘      │   postgresql    │  :5432
                     │  (named volume) │
                     └─────────────────┘
```

Three services in `docker-compose.yml`: `nginx` (embeds the built React app + proxies), `fastapi`, `postgres` — matching the `[nginx+react, FastAPI, PostgreSQL]` container layout.

---

## 4. Repository Structure

```
cpgrams-guided-grievance/
├── docker-compose.yml
├── .env.example
├── plan.md
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── deps.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── department.py
│   │   │   ├── grievance.py
│   │   │   ├── grievance_event.py       # routing hops + status trail
│   │   │   ├── atr.py                   # Action Taken Reports
│   │   │   └── review_window.py         # resolution + appeal SLAs
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── grievance.py
│   │   │   └── auth.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── grievances.py
│   │   │   ├── officers.py              # mock "officer side" actions
│   │   │   ├── dashboard.py
│   │   │   └── admin.py
│   │   ├── services/
│   │   │   ├── classifier.py            # complaint vs grievance vs suggestion
│   │   │   ├── routing_engine.py        # simulates ministry → dept → district hops
│   │   │   ├── atr_quality_check.py     # flags vague/templated ATRs
│   │   │   ├── sla_engine.py            # 21-day + 30-day windows
│   │   │   ├── notifications.py
│   │   │   └── seed_mock_data.py
│   │   └── core/
│   │       ├── security.py
│   │       └── enums.py
│   └── tests/
│
├── frontend/
│   ├── Dockerfile
│   ├── vite.config.js
│   ├── package.json
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/client.js
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── IntakeWizard.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── GrievanceDetail.jsx
│   │   │   └── OfficerConsole.jsx       # mock "officer/admin" view for demo
│   │   ├── components/
│   │   │   ├── layout/ (Header, Footer, InfoForBar)
│   │   │   ├── RoutingTrail.jsx         # visual hop-by-hop trail
│   │   │   ├── SLAClock.jsx
│   │   │   ├── ClassificationCard.jsx
│   │   │   ├── ATRQualityBadge.jsx
│   │   │   └── GrievanceCard.jsx
│   │   └── styles/
│   └── public/
│
└── nginx/
    ├── Dockerfile
    └── default.conf
```

---

## 5. Data Model (PostgreSQL via SQLAlchemy)

### 5.1 Core tables

**`users`**
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| role | enum(`citizen`, `officer`, `admin`) | |
| name | text | |
| email | text unique | |
| phone | text | mock, no OTP |
| hashed_password | text | |
| created_at | timestamptz | |

**`departments`** (mock ministries/departments/district offices)
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| name | text | e.g. "Dept. of Pensions & Pensioners' Welfare" (synthetic where needed) |
| level | enum(`ministry`, `department`, `district_office`) | used by the routing engine to simulate hops |
| parent_department_id | UUID FK → departments, nullable | builds the ministry → department → district hierarchy |

**`grievances`** — the central record
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| registration_id | text unique | human-readable, e.g. `CPG-2026-000456` |
| citizen_id | UUID FK → users | |
| current_department_id | UUID FK → departments | where the file currently sits |
| raw_description | text | citizen's plain-language input |
| category | enum(`complaint`, `grievance`, `suggestion`) | set by classifier |
| status | enum(`submitted`, `routed`, `under_review`, `atr_filed`, `resolved`, `rated_poor`, `appeal_open`, `appeal_resolved`, `closed`) | |
| citizen_rating | enum(`good`, `average`, `poor`), nullable | set at closure; `poor` unlocks appeal |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**`grievance_events`** — append-only audit trail, doubles as the routing trail
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| grievance_id | UUID FK | |
| event_type | text | e.g. `submitted`, `routed_to_department`, `atr_filed`, `rated`, `appeal_filed` |
| from_department_id | UUID FK → departments, nullable | |
| to_department_id | UUID FK → departments, nullable | powers the visible hop-by-hop `RoutingTrail` UI |
| actor_role | enum(`citizen`, `officer`, `system`, `admin`) | |
| payload | JSONB | free-form event detail |
| created_at | timestamptz | |

**`atrs`** — Action Taken Reports (separated out so we can run quality checks on them)
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| grievance_id | UUID FK | |
| officer_id | UUID FK → users | |
| content | text | the officer's explanation |
| quality_flag | enum(`ok`, `too_short`, `templated_language_detected`) | set by `atr_quality_check.py` |
| created_at | timestamptz | |

**`review_windows`** — the SLA engine's core table
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| grievance_id | UUID FK | |
| window_type | enum(`resolution`, `appeal`) | resolution = 21 days from submission; appeal = 30 days from "Poor" rating |
| opens_at | timestamptz | |
| deadline_at | timestamptz | |
| closed_at | timestamptz, nullable | |
| status | enum(`open`, `met`, `missed`, `escalated`) | computed by `sla_engine.py` |

This table drives the dashboard's countdown — the single biggest UX fix over the real CPGRAMS flow, where a citizen has to remember both the 21-day and 30-day windows themselves.

### 5.2 Alembic setup

```bash
cd backend
alembic init alembic
```

In `alembic/env.py`, import `Base` from `app.database` and set `target_metadata = Base.metadata`.

Team workflow after any model change:
```bash
alembic revision --autogenerate -m "add atrs and review_windows tables"
alembic upgrade head
```

Run migrations automatically on container start (see `entrypoint.sh` in Section 8.3) so `docker compose up` always gives a fully migrated DB.

---

## 6. Classification Logic (the "smart intake" core)

**`services/classifier.py`** — keep this legible for a live demo, not a black box:

1. **Rules/keyword first pass** (fast, explainable):
   - Specific harm to the citizen described ("my pension hasn't come," "my passport was denied wrongly," "my refund is stuck") → `complaint` — the strongest category, requiring an ATR before closure
   - General service quality issue not tied to one incident ("this office is always slow," "your website is confusing") → `grievance`
   - Idea for improvement, no harm described ("you should add an SMS update feature") → `suggestion` — correctly routed to a lower-priority queue, but **the citizen sees why**, so it can't be used to quietly downgrade a real complaint
2. **LLM-assisted classification (stretch goal)**: send the free-text description to an LLM with a structured prompt asking for `category` + `confidence` + `reasoning`, shown back to the citizen — directly counters the real-world pattern of departments silently reclassifying complaints as suggestions, since the reasoning is visible and citizen-confirmed *before* submission, not decided unilaterally afterward by the department.
3. **Human-in-the-loop override**: always show the suggested classification and let the citizen confirm or correct it before submitting.

Log the classifier's reasoning as a `grievance_events` entry (`classification_suggested`) — useful evidence for the "Honesty" judging criterion.

---

## 7. Routing Engine (simulating ministry → department → district hops)

**`services/routing_engine.py`**:
- On submission, the classifier's category + description keywords map to a starting `department` (e.g. "pension" → Dept. of Pensions & Pensioners' Welfare)
- If that department is a `ministry`-level node with children, the engine auto-forwards to the appropriate `department`-level child, and again to a `district_office`-level child if applicable — each hop logged as a `grievance_events` row with `from_department_id` / `to_department_id`
- The frontend's `RoutingTrail.jsx` renders this as a simple horizontal or vertical trail: **Ministry → Department → District Office**, with a timestamp at each hop — this single component is the direct fix for "no visibility into where a grievance actually sits," and should be the visual centerpiece of `GrievanceDetail.jsx`

---

## 8. SLA / Deadline Engine

**`services/sla_engine.py`**, triggered by:
- On submission → open a `resolution` window (21-day deadline)
- On officer's ATR filed and grievance marked resolved → close `resolution` window
- On citizen rating = `poor` → open an `appeal` window (30-day deadline) automatically, so the citizen doesn't have to separately "know" to file one
- On appeal filed/resolved → close `appeal` window

**APScheduler job** (runs periodically inside the FastAPI process):
```python
# pseudocode
for window in get_open_windows():
    if now() > window.deadline_at:
        window.status = "missed"
        create_event(window.grievance_id, "sla_missed", actor="system")
        notify(window.grievance_id, "Your resolution window has passed — here's what to do next")
    elif window.deadline_at - now() < timedelta(days=3):
        notify(window.grievance_id, "Your window closes soon")
```

Demo beat: show a grievance whose 21-day window is about to expire and the dashboard proactively flags it, then show a "Poor" rating automatically opening the 30-day appeal window without the citizen having to know that rule exists — that's the clearest before/after story against the real system.

---

## 9. FastAPI Backend Design

### 9.1 Key endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | mock citizen/officer signup |
| POST | `/api/auth/login` | returns JWT |
| POST | `/api/grievances/classify` | takes free-text, returns suggested category + reasoning (no DB write yet) |
| POST | `/api/grievances` | creates grievance using confirmed classification; triggers routing engine |
| GET | `/api/grievances` | citizen's own grievances (dashboard list) |
| GET | `/api/grievances/{id}` | full detail incl. routing trail + ATR + SLA windows |
| POST | `/api/grievances/{id}/rate` | citizen submits closure rating; `poor` auto-opens appeal window |
| POST | `/api/grievances/{id}/appeal` | citizen files appeal within the window |
| POST | `/api/grievances/{id}/atr` | officer/admin submits an ATR (demo-only "officer console" endpoint); runs quality check |
| GET | `/api/dashboard/summary` | counts by status/department, overdue count |
| GET | `/api/admin/departments` | seed/list mock departments |

### 9.2 Project conventions
- Pydantic v2 schemas separate from SQLAlchemy models
- Dependency-injected DB session via `deps.py` (`get_db`)
- Role-based access via `require_role()` dependency (citizens see only their own grievances; officer/admin console gated separately)
- CORS: allow only the nginx-proxied frontend origin
- All timestamps stored UTC, formatted IST on the frontend

### 9.3 `backend/Dockerfile` (sketch)

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

`entrypoint.sh` runs `alembic upgrade head`, then `python -m app.services.seed_mock_data`, then `uvicorn app.main:app --host 0.0.0.0 --port 8000`.

---

## 10. Frontend Design (React, `.jsx`) — informed by pgportal.gov.in's actual structure

We deliberately **echo CPGRAMS's own information architecture** (so it feels familiar/credible to a judge who's seen the real portal) while fixing the actual flow:

- The real pgportal.gov.in homepage leads with clear top-level actions — Lodge Grievance, View Status, Grievance Appeal — front and center. We mirror this exact three-action pattern on our own landing page, since it's already the correct mental model; we just fix what happens after each click.
- CPGRAMS is explicitly meant to be a **single portal connected to all ministries/departments** with **role-based access** per ministry/state — our routing engine and department hierarchy are a direct, buildable version of that same idea, just made visible to the citizen instead of hidden.
- The real portal's status view is a single line of text. Ours replaces that with the `RoutingTrail` (who holds the file now, and how it got there) and the `SLAClock` (time left, or time overdue) — this is the concrete, demoable improvement.

### 10.1 Pages

1. **Landing (`/`)** — plain-language framing: "Have a problem with a government office or service? Tell us what happened." Big CTA. Secondary links: "Track an existing grievance," "File an appeal."
2. **Login/Register (`/login`)** — mock auth, citizen role for the main demo (officer/admin reachable via `/officer` for the live demo).
3. **Intake Wizard (`/file`)** — multi-step:
   - Step 1: Free-text "what happened" box + department autocomplete (optional — from seeded `departments`)
   - Step 2: Show classifier's suggestion ("This looks like a **Complaint**, which requires a detailed Action Taken Report before it can be closed") with reasoning; citizen can override
   - Step 3: Review & submit → confirmation screen with registration ID
4. **Dashboard (`/dashboard`)** — card list of all grievances, each showing: registration ID, category badge, current department, status, and an **SLA clock** (green/amber/red).
5. **Grievance Detail (`/grievances/:id`)** — `RoutingTrail` component showing every hop (ministry → department → district), the ATR once filed (with a visible `ATRQualityBadge` if it looks templated/too short), the current SLA window with countdown, a **rating prompt** at closure that plainly states "Rating this 'Poor' lets you appeal within 30 days" (fixing the hidden-trigger problem directly), and glossary tooltips for ATR, NAA, DARPG, etc. reusing the terms from the team's CPGRAMS briefing doc.
6. **Officer Console (`/officer`)** — demo-only screen to simulate the "other side": file an ATR, mark a grievance resolved, decide an appeal — so the team can drive the demo narrative live.

### 10.2 Component notes
- `RoutingTrail.jsx`: your visual signature feature — make sure it's the first thing judges notice on `GrievanceDetail`.
- `SLAClock.jsx`: countdown component, colors by proximity to deadline; reused for both the 21-day resolution window and the 30-day appeal window.
- `ClassificationCard.jsx`: shows classifier output + reasoning + an "This is wrong, let me choose" override control.
- `ATRQualityBadge.jsx`: small flag ("This response looks generic — consider requesting more detail") shown to the citizen when `atr_quality_check.py` flags an ATR — directly demoable evidence of the "vague/templated closures" fix.
- Calm, trustworthy visual language, less dense than pgportal.gov.in, mobile-first (the brief calls out users on slower connections/limited digital experience).

### 10.3 `frontend/Dockerfile` (multi-stage, built into nginx)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# output in /app/dist — copied by nginx/Dockerfile, not run here
```

---

## 11. Nginx (`nginx/default.conf`)

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # React SPA fallback
    location / {
        try_files $uri /index.html;
    }

    # Reverse proxy to FastAPI
    location /api/ {
        proxy_pass http://fastapi:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`nginx/Dockerfile` copies the React build output plus this config:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY ../frontend/package*.json ./
RUN npm ci
COPY ../frontend .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## 12. `docker-compose.yml` (sketch)

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432" # optional, drop for prod

  fastapi:
    build: ./backend
    restart: unless-stopped
    env_file: .env
    depends_on:
      - postgres
    expose:
      - "8000"

  nginx:
    build:
      context: .
      dockerfile: nginx/Dockerfile
    restart: unless-stopped
    depends_on:
      - fastapi
    ports:
      - "80:80"

volumes:
  pgdata:
```

`.env.example`:
```
POSTGRES_DB=cpgrams_grievance
POSTGRES_USER=cpgrams_admin
POSTGRES_PASSWORD=changeme
DATABASE_URL=postgresql+psycopg://cpgrams_admin:changeme@postgres:5432/cpgrams_grievance
JWT_SECRET=changeme
JWT_EXPIRE_MINUTES=1440
```

Single command to run everything: `docker compose up --build`.

---

## 13. Mock/Synthetic Data Strategy

- `services/seed_mock_data.py` runs on backend startup (idempotent):
  - ~8-10 synthetic departments across all three hierarchy levels (2-3 ministries, each with 2-3 departments, each with 1-2 district offices), clearly fictional or generically named (e.g. "Dept. of Citizen Services — Regional Office"), not copying any real office's exact internal structure
  - 3-5 pre-seeded citizen accounts with grievances already at different lifecycle stages (one about to miss its 21-day window, one just rated "Poor" with an open appeal window, one cleanly resolved) — **so the dashboard looks alive within 10 seconds of `docker compose up`**
- No real Aadhaar/OTP/government-SSO fields anywhere in the schema — omit entirely rather than mock, cleanest way to stay clearly compliant with the brief.

---

## 14. Build Order / Timeline (targeting Aug 27 submission)

| Phase | Days | Deliverable |
|---|---|---|
| 1. Setup | Day 1 | Repo scaffold, docker-compose boots all 3 containers, empty FastAPI `/health` reachable through nginx |
| 2. Data layer | Day 1–2 | SQLAlchemy models, first Alembic migration, seed script |
| 3. Core API | Day 2–3 | Auth, grievance CRUD, classifier (rules-based v1) |
| 4. Routing engine | Day 3 | Ministry → department → district hop simulation + `grievance_events` logging |
| 5. SLA engine | Day 3–4 | `review_windows` logic + APScheduler job + endpoint to view SLA status |
| 6. Frontend skeleton | Day 2–4 (parallel) | Routing, layout shell (CPGRAMS-inspired header/footer), login |
| 7. Intake Wizard + Dashboard | Day 4–5 | End-to-end: submit → classify → route → see on dashboard |
| 8. Grievance Detail (Routing Trail + SLA Clock + ATR quality badge) | Day 5–6 | Full citizen journey complete |
| 9. Officer Console (demo tool) | Day 6 | Enough to drive a live ATR/rating/appeal during demo |
| 10. Polish, seed realistic demo data, record video | Day 6–7 | 3-min demo video, write-up, deployed/live demo link |
| Buffer | remaining days | Bug fixes, judge-Q&A prep, "what's mocked vs real" doc |

Assign by strength: 1 person owns backend/data model + Alembic, 1 owns classifier + routing + SLA engine, 2 on frontend (one on Intake Wizard, one on Dashboard/Detail/RoutingTrail/SLAClock), 1 floats on nginx/Docker/deployment + demo video/write-up.

---

## 15. What Goes in the Submission Write-Up (map back to judging criteria)

- **Problem** → cite the documented backlog figures (tens of thousands of pending grievances, thousands past 90 days), the ATR requirement's origin (introduced because closures were too vague), and the hidden "Poor rating unlocks appeal" mechanic.
- **Working build** → link + note the full citizen journey works end-to-end (submit → classify → route → track hops → ATR quality check → rate → auto-opened appeal window), driven by seeded data + Officer Console for the demo.
- **Usability** → screenshots of the Intake Wizard, RoutingTrail, and SLA Clock; explicitly contrast against the real portal's single opaque status line.
- **Product thinking** → explain the classifier + routing engine + ATR quality check as the real fix, not a visual redesign.
- **End-to-end thinking** → the routing engine and SLA engine are your strongest evidence — both are backend/process fixes, not screens.
- **Honesty** → explicit "What's real vs. mocked" table: real (classification logic, routing simulation, SLA engine, ATR quality check, DB-backed lifecycle) vs. mocked (department identities, no live CPGRAMS integration, mock auth, no real officer content).

---

## 16. Stretch Goals (only if core is done early)

- Real LLM call for classification reasoning and ATR quality checking, shown transparently to the citizen — satisfies any "AI-assisted build" requirement explicitly and directly counters the "robotic, templated closure" problem with a visible, explainable check.
- Email/SMS notifications (simple SMTP or a mock inbox screen) for SLA warnings, mirroring the real portal's SMS/email closure alerts but adding proactive *deadline* alerts, which the real system lacks.
- Hindi/regional language toggle on the Intake Wizard — directly addresses "real Indian users... limited digital experience" from the brief, and is especially relevant since CPGRAMS serves citizens nationwide, not a single-language user base.
- Simple analytics view (admin) showing which departments have the highest overdue rate or the most "templated" ATR flags — a plausible "how could this work at scale, and drive accountability" answer for the judging Q&A, echoing real Parliamentary committee recommendations for officer accountability metrics.
