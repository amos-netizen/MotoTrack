from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models
from app.auth import get_current_user
from app.models import User
from app.schemas import AppointmentCreate, AppointmentOut, AppointmentUpdate, NextServiceRecommendation

router = APIRouter()


@router.post("/", response_model=AppointmentOut)
def create_appointment(payload: AppointmentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.vin == payload.vehicle_vin).first()
    if vehicle is None:
        vehicle = models.Vehicle(
            vin=payload.vehicle_vin,
            owner_name="Unknown",
            owner_contact="owner@example.com",
            current_mileage=0,
        )
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)

    appt = models.Appointment(
        vehicle_id=vehicle.id,
        service_type=payload.service_type,
        scheduled_at=payload.scheduled_at,
        notes=payload.notes or "",
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    # Create reminder 24h before
    reminder_time = payload.scheduled_at - timedelta(hours=24)
    reminder = models.Reminder(
        appointment_id=appt.id,
        channel="log",
        message=f"Reminder: {payload.service_type} on {payload.scheduled_at.isoformat()}",
        scheduled_for=reminder_time,
    )
    db.add(reminder)
    db.commit()

    return appt


@router.get("/", response_model=List[AppointmentOut])
def list_appointments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(models.Appointment).order_by(models.Appointment.scheduled_at.desc())
    # Note: Appointments are not linked to garage in model; can extend if needed
    return q.all()


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if appt is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


@router.patch("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(appointment_id: int, payload: AppointmentUpdate, db: Session = Depends(get_db)):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if appt is None:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if payload.service_type is not None:
        appt.service_type = payload.service_type
    if payload.scheduled_at is not None:
        appt.scheduled_at = payload.scheduled_at
        # Update or add reminder 24h before new time
        reminder = (
            db.query(models.Reminder)
            .filter(models.Reminder.appointment_id == appointment_id)
            .first()
        )
        if reminder:
            reminder.scheduled_for = payload.scheduled_at - timedelta(hours=24)
            reminder.message = f"Reminder: {appt.service_type} on {payload.scheduled_at.isoformat()}"
        else:
            reminder = models.Reminder(
                appointment_id=appointment_id,
                channel="log",
                message=f"Reminder: {appt.service_type} on {payload.scheduled_at.isoformat()}",
                scheduled_for=payload.scheduled_at - timedelta(hours=24),
            )
            db.add(reminder)
    if payload.notes is not None:
        appt.notes = payload.notes
    if payload.status is not None:
        appt.status = payload.status

    db.commit()
    db.refresh(appt)
    return appt


@router.get("/next-service/recommendation/{vehicle_vin}", response_model=NextServiceRecommendation)
def next_service_recommendation(vehicle_vin: str, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.vin == vehicle_vin).first()
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Basic heuristic: recommend every 10,000 km or 12 months since last service
    last_service = (
        db.query(models.ServiceHistory)
        .filter(models.ServiceHistory.vehicle_id == vehicle.id)
        .order_by(models.ServiceHistory.date.desc())
        .first()
    )

    reason = "Default interval: 10,000 km or 12 months"
    due_by_mileage = vehicle.current_mileage + 10000
    due_by_date = None
    if last_service:
        from datetime import timedelta as _td
        due_by_date = last_service.date + _td(days=365)
        reason = f"Based on last service on {last_service.date.isoformat()} at {last_service.mileage} km"

    return NextServiceRecommendation(due_by_mileage=due_by_mileage, due_by_date=due_by_date, reason=reason)
