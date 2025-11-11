from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.scheduler import get_scheduler, start_scheduler, shutdown_scheduler
from app.routers.orders import router as orders_router
from app.routers.appointments import router as appointments_router
from app.routers.auth import router as auth_router
from app.routers.garages import router as garages_router
from app.routers import jobs, spare_parts, warehouse, billing, task_actions

app = FastAPI(title="MotoTrack Service Assistant", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders_router, prefix="/orders", tags=["orders"])
app.include_router(appointments_router, prefix="/appointments", tags=["appointments"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(garages_router, prefix="/garages", tags=["garages"])
app.include_router(jobs.router)
app.include_router(spare_parts.router)
app.include_router(warehouse.router)
app.include_router(billing.router)
app.include_router(task_actions.router)


@app.on_event("startup")
async def on_startup() -> None:
    init_db()
    scheduler = get_scheduler()
    start_scheduler(scheduler)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    scheduler = get_scheduler()
    shutdown_scheduler(scheduler)


@app.get("/healthz")
async def healthz() -> dict:
    return {"status": "ok"}
