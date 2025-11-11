from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field


class VehicleCreate(BaseModel):
    vin: str
    owner_name: str
    owner_contact: str
    current_mileage: int = 0


class VehicleOut(BaseModel):
    id: int
    vin: str
    owner_name: str
    owner_contact: str
    current_mileage: int

    class Config:
        from_attributes = True


class ServiceOrderCreate(BaseModel):
    vehicle_vin: str = Field(..., description="VIN of the vehicle")
    garage_id: int | None = None
    work_requested: Optional[str] = ""


class ServiceOrderUpdateStatus(BaseModel):
    status: str = Field(..., pattern="^(in_progress|ready|completed|cancelled)$")
    work_done: Optional[str] = None
    final_cost: Optional[float] = None
    mechanic_notes: Optional[str] = None


class ServiceOrderOut(BaseModel):
    id: int
    vehicle_id: int
    garage_id: int | None
    created_at: datetime
    status: str
    work_done: str
    final_cost: float
    mechanic_notes: str
    ready_notified: bool

    class Config:
        from_attributes = True


class AppointmentCreate(BaseModel):
    vehicle_vin: str
    garage_id: int | None = None
    service_type: str
    scheduled_at: datetime
    notes: Optional[str] = ""


class AppointmentUpdate(BaseModel):
    service_type: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(scheduled|completed|cancelled)$")


class AppointmentOut(BaseModel):
    id: int
    vehicle_id: int
    service_type: str
    scheduled_at: datetime
    notes: str
    status: str

    class Config:
        from_attributes = True


class ReminderOut(BaseModel):
    id: int
    appointment_id: Optional[int]
    channel: str
    message: str
    scheduled_for: datetime
    sent_at: Optional[datetime]

    class Config:
        from_attributes = True


class ServiceHistoryOut(BaseModel):
    id: int
    vehicle_id: int
    date: date
    mileage: int
    service_type: str
    notes: str

    class Config:
        from_attributes = True


class NextServiceRecommendation(BaseModel):
    due_by_mileage: Optional[int] = None
    due_by_date: Optional[date] = None
    reason: str
