from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import alerts, auth, health, medicines, pay, users
from app.config import get_settings

app = FastAPI(title="Roster API")

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
# RosterRX
app.include_router(medicines.router)
app.include_router(alerts.router)
app.include_router(users.router)
# RosterPay
app.include_router(pay.router)
