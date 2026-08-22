from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import admin, auth, dashboard, grievances, officers
from app.services.seed_mock_data import seed
from app.services.sla_engine import evaluate_open_windows

app = FastAPI(title="CPGRAMS Guided Grievance Router", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(grievances.router, prefix="/api")
app.include_router(officers.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

scheduler = BackgroundScheduler()


@app.on_event("startup")
def on_startup():
    if settings.database_url.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
    seed()
    if not scheduler.running:
        scheduler.add_job(_run_sla_job, "interval", minutes=30, id="sla_window_scan", replace_existing=True)
        scheduler.start()


@app.on_event("shutdown")
def on_shutdown():
    if scheduler.running:
        scheduler.shutdown()


def _run_sla_job():
    db = SessionLocal()
    try:
        evaluate_open_windows(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/health")
def api_health():
    return {"status": "ok"}
