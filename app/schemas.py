from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models import OperationsStream, RevenueStream, JobStatus, RequestStatus


# Vehicle Schemas
class VehicleCreate(BaseModel):
    registration_number: str
    vin: Optional[str] = None
    owner_name: str
    owner_contact: str
    current_mileage: int = 0
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None


class VehicleOut(BaseModel):
    id: int
    registration_number: str
    vin: Optional[str]
    owner_name: str
    owner_contact: str
    current_mileage: int
    make: Optional[str]
    model: Optional[str]
    year: Optional[int]

    class Config:
        from_attributes = True


# Job Schemas
class JobCreate(BaseModel):
    registration_number: str
    owner_name: str
    owner_contact: str
    vin: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    current_mileage: int = 0
    operations_stream: OperationsStream
    revenue_stream: RevenueStream
    issues_reported: str


class JobAssign(BaseModel):
    technician_id: int


class JobUpdate(BaseModel):
    work_done: Optional[str] = None
    status: Optional[JobStatus] = None


class JobOut(BaseModel):
    id: int
    vehicle_id: int
    garage_id: int
    site_manager_id: int
    technician_id: Optional[int]
    operations_stream: str
    revenue_stream: str
    status: str
    issues_reported: str
    work_done: str
    manager_notes: str
    created_at: datetime
    assigned_at: Optional[datetime]
    completed_at: Optional[datetime]
    invoice_id: Optional[int]

    class Config:
        from_attributes = True


class JobDetailOut(JobOut):
    vehicle: VehicleOut
    site_manager: Optional[dict] = None
    technician: Optional[dict] = None
    spare_part_requests: List[dict] = []
    task_actions: List[dict] = []

    class Config:
        from_attributes = True


# Task Action Schemas
class TaskActionCreate(BaseModel):
    operations_stream: OperationsStream
    name: str
    description: Optional[str] = ""
    default_labor_cost: float = 0.0


class TaskActionOut(BaseModel):
    id: int
    operations_stream: str
    name: str
    description: str
    default_labor_cost: float
    is_active: bool

    class Config:
        from_attributes = True


class JobTaskActionCreate(BaseModel):
    task_action_id: int
    labor_cost: Optional[float] = None
    notes: Optional[str] = ""


class JobTaskActionOut(BaseModel):
    id: int
    job_id: int
    task_action_id: int
    labor_cost: float
    notes: str
    completed: bool
    task_action: Optional[TaskActionOut] = None

    class Config:
        from_attributes = True


# Spare Part Request Schemas
class SparePartRequestCreate(BaseModel):
    warehouse_item_id: int
    quantity: int
    notes: Optional[str] = ""


class SparePartRequestOut(BaseModel):
    id: int
    job_id: int
    warehouse_item_id: int
    quantity: int
    status: str
    requested_by_id: int
    approved_by_id: Optional[int]
    issued_by_id: Optional[int]
    requested_at: datetime
    approved_at: Optional[datetime]
    issued_at: Optional[datetime]
    notes: str
    warehouse_item: Optional[dict] = None

    class Config:
        from_attributes = True


# Warehouse Schemas
class WarehouseItemCreate(BaseModel):
    name: str
    part_number: Optional[str] = None
    description: Optional[str] = ""
    quantity_in_stock: int = 0
    unit_price: float = 0.0
    reorder_level: int = 0


class WarehouseItemUpdate(BaseModel):
    name: Optional[str] = None
    part_number: Optional[str] = None
    description: Optional[str] = None
    quantity_in_stock: Optional[int] = None
    unit_price: Optional[float] = None
    reorder_level: Optional[int] = None
    is_active: Optional[bool] = None


class WarehouseItemOut(BaseModel):
    id: int
    name: str
    part_number: Optional[str]
    description: str
    quantity_in_stock: int
    unit_price: float
    reorder_level: int
    is_active: bool

    class Config:
        from_attributes = True


# Invoice Schemas
class InvoiceItemCreate(BaseModel):
    warehouse_item_id: Optional[int] = None
    description: str
    quantity: int = 1
    unit_price: float
    item_type: str  # labor, part, service


class InvoiceCreate(BaseModel):
    job_id: int
    items: List[InvoiceItemCreate]
    tax_rate: float = 0.0


class InvoiceOut(BaseModel):
    id: int
    job_id: int
    invoice_number: str
    subtotal: float
    tax: float
    total: float
    created_at: datetime
    paid: bool
    paid_at: Optional[datetime]
    items: List[dict] = []

    class Config:
        from_attributes = True


# User Schemas
class UserCreate(BaseModel):
    email: str
    password: str
    role: str = "client"
    garage_id: Optional[int] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: str
    role: str
    garage_id: Optional[int]
    full_name: Optional[str]
    phone: Optional[str]

    class Config:
        from_attributes = True


# Legacy Schemas (keeping for backward compatibility)
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
