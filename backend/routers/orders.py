from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models
from app.schemas import ServiceOrderCreate, ServiceOrderOut, ServiceOrderUpdateStatus
from app.auth import require_role, get_current_user
from app.models import User
from app.notifications import send_notification

router = APIRouter()


@router.post("/", response_model=ServiceOrderOut)
def create_service_order(payload: ServiceOrderCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.vin == payload.vehicle_vin).first()
    if vehicle is None:
        # Auto-create vehicle with minimal info
        vehicle = models.Vehicle(
            vin=payload.vehicle_vin,
            owner_name="Unknown",
            owner_contact="owner@example.com",
            current_mileage=0,
        )
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)

    order = models.ServiceOrder(vehicle_id=vehicle.id, garage_id=payload.garage_id or user.garage_id)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/", response_model=List[ServiceOrderOut])
def list_service_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(models.ServiceOrder).order_by(models.ServiceOrder.created_at.desc())
    if user.role == 'staff' and user.garage_id:
        q = q.filter(models.ServiceOrder.garage_id == user.garage_id)
    elif user.role == 'client':
        # basic: show client's vehicle orders by VIN ownership is not modeled; show all for demo
        pass
    return q.all()


@router.get("/{order_id}", response_model=ServiceOrderOut)
def get_service_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.ServiceOrder).filter(models.ServiceOrder.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Service order not found")
    return order


@router.patch("/{order_id}/status", response_model=ServiceOrderOut, dependencies=[Depends(require_role('staff','admin'))])
def update_service_order_status(order_id: int, payload: ServiceOrderUpdateStatus, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = db.query(models.ServiceOrder).filter(models.ServiceOrder.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Service order not found")
    if user.role == 'staff' and user.garage_id and order.garage_id != user.garage_id:
        raise HTTPException(status_code=403, detail="Not your garage")

    if payload.status:
        order.status = payload.status
    if payload.work_done is not None:
        order.work_done = payload.work_done
    if payload.final_cost is not None:
        order.final_cost = payload.final_cost
    if payload.mechanic_notes is not None:
        order.mechanic_notes = payload.mechanic_notes

    # If status changed to ready, notify owner with details
    if order.status == "ready" and not order.ready_notified:
        vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == order.vehicle_id).first()
        subject = "Your car is ready for pickup"
        message = f"Work done: {order.work_done or 'N/A'} | Final cost: ${order.final_cost:.2f}. Notes: {order.mechanic_notes or '—'}"
        send_notification("log", vehicle.owner_contact, subject, message)
        order.ready_notified = True

    db.commit()
    db.refresh(order)
    return order
