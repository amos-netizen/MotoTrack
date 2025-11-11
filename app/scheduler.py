from __future__ import annotations
from datetime import datetime
from typing import Optional
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Reminder
from app.notifications import send_notification

_scheduler: Optional[BackgroundScheduler] = None


def get_scheduler() -> BackgroundScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = BackgroundScheduler()
    return _scheduler


def start_scheduler(scheduler: BackgroundScheduler) -> None:
    if not scheduler.running:
        scheduler.start()
        scheduler.add_job(process_due_reminders, "interval", seconds=30, id="process_due_reminders", replace_existing=True)


def shutdown_scheduler(scheduler: BackgroundScheduler) -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)


def process_due_reminders() -> None:
    now = datetime.utcnow()
    db: Session = SessionLocal()
    try:
        due = (
            db.query(Reminder)
            .filter(Reminder.sent_at.is_(None))
            .filter(Reminder.scheduled_for <= now)
            .all()
        )
        for r in due:
            send_notification(r.channel, "owner", "Appointment Reminder", r.message)
            r.sent_at = now
        if due:
            db.commit()
    finally:
        db.close()
