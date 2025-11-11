from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Date, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.database import Base
from sqlalchemy import UniqueConstraint


class OperationsStream(str, enum.Enum):
    BODY_WORKS = "body_works"
    MECHANICAL_WORKS = "mechanical_works"
    ELECTRICAL_WORKS = "electrical_works"
    INTERIOR_WORKS = "interior_works"


class RevenueStream(str, enum.Enum):
    WALK_IN = "walk_in"
    SCHEDULED_SERVICE = "scheduled_service"
    SPARE_PARTS = "spare_parts"


class JobStatus(str, enum.Enum):
    RECEIVED = "received"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    AWAITING_PARTS = "awaiting_parts"
    COMPLETED = "completed"
    MANAGER_REVIEW = "manager_review"
    BILLING = "billing"
    INVOICED = "invoiced"
    CANCELLED = "cancelled"


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    ISSUED = "issued"
    COMPLETED = "completed"
    REJECTED = "rejected"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(32), unique=True, index=True, nullable=False)
    vin = Column(String(32), unique=True, index=True, nullable=True)
    owner_name = Column(String(128), nullable=False)
    owner_contact = Column(String(128), nullable=False)
    current_mileage = Column(Integer, default=0, nullable=False)
    make = Column(String(64), nullable=True)
    model = Column(String(64), nullable=True)
    year = Column(Integer, nullable=True)

    service_orders = relationship("ServiceOrder", back_populates="vehicle")
    appointments = relationship("Appointment", back_populates="vehicle")
    service_history = relationship("ServiceHistory", back_populates="vehicle")
    jobs = relationship("Job", back_populates="vehicle")


class Garage(Base):
    __tablename__ = "garages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), unique=True, nullable=False)
    address = Column(String(256), default="")

    orders = relationship("ServiceOrder", back_populates="garage")
    staff = relationship("User", back_populates="garage")
    jobs = relationship("Job", back_populates="garage")


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint('email', name='uq_users_email'),)

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(128), nullable=False)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), nullable=False, default='client')  # client, staff, admin, site_manager, workshop_manager, warehouse_manager, technician
    garage_id = Column(Integer, ForeignKey("garages.id"), nullable=True)
    full_name = Column(String(128), nullable=True)
    phone = Column(String(32), nullable=True)

    garage = relationship("Garage", back_populates="staff")
    assigned_jobs = relationship("Job", foreign_keys="Job.technician_id", back_populates="technician")
    created_jobs = relationship("Job", foreign_keys="Job.site_manager_id", back_populates="site_manager")


class ServiceOrder(Base):
    __tablename__ = "service_orders"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    garage_id = Column(Integer, ForeignKey("garages.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(32), default="in_progress", index=True)  # in_progress, ready, completed, cancelled
    work_done = Column(Text, default="")
    final_cost = Column(Float, default=0.0)
    mechanic_notes = Column(Text, default="")
    ready_notified = Column(Boolean, default=False)

    vehicle = relationship("Vehicle", back_populates="service_orders")
    garage = relationship("Garage", back_populates="orders")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    garage_id = Column(Integer, ForeignKey("garages.id"), nullable=False)
    site_manager_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    operations_stream = Column(SQLEnum(OperationsStream), nullable=False)
    revenue_stream = Column(SQLEnum(RevenueStream), nullable=False)
    status = Column(SQLEnum(JobStatus), default=JobStatus.RECEIVED, index=True)
    issues_reported = Column(Text, nullable=False)
    work_done = Column(Text, default="")
    manager_notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    assigned_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)

    vehicle = relationship("Vehicle", back_populates="jobs")
    garage = relationship("Garage", back_populates="jobs")
    site_manager = relationship("User", foreign_keys=[site_manager_id], back_populates="created_jobs")
    technician = relationship("User", foreign_keys=[technician_id], back_populates="assigned_jobs")
    spare_part_requests = relationship("SparePartRequest", back_populates="job")
    invoice = relationship("Invoice", foreign_keys=[invoice_id], back_populates="job")
    task_actions = relationship("JobTaskAction", back_populates="job")


class TaskAction(Base):
    __tablename__ = "task_actions"

    id = Column(Integer, primary_key=True, index=True)
    operations_stream = Column(SQLEnum(OperationsStream), nullable=False)
    name = Column(String(128), nullable=False)
    description = Column(Text, default="")
    default_labor_cost = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)

    job_task_actions = relationship("JobTaskAction", back_populates="task_action")


class JobTaskAction(Base):
    __tablename__ = "job_task_actions"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    task_action_id = Column(Integer, ForeignKey("task_actions.id"), nullable=False)
    labor_cost = Column(Float, default=0.0)
    notes = Column(Text, default="")
    completed = Column(Boolean, default=False)

    job = relationship("Job", back_populates="task_actions")
    task_action = relationship("TaskAction", back_populates="job_task_actions")


class SparePartRequest(Base):
    __tablename__ = "spare_part_requests"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    warehouse_item_id = Column(Integer, ForeignKey("warehouse_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(SQLEnum(RequestStatus), default=RequestStatus.PENDING, index=True)
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    issued_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    approved_at = Column(DateTime, nullable=True)
    issued_at = Column(DateTime, nullable=True)
    notes = Column(Text, default="")

    job = relationship("Job", back_populates="spare_part_requests")
    warehouse_item = relationship("WarehouseItem", back_populates="requests")
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    issued_by = relationship("User", foreign_keys=[issued_by_id])


class WarehouseItem(Base):
    __tablename__ = "warehouse_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    part_number = Column(String(64), unique=True, index=True, nullable=True)
    description = Column(Text, default="")
    quantity_in_stock = Column(Integer, default=0, nullable=False)
    unit_price = Column(Float, default=0.0, nullable=False)
    reorder_level = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    requests = relationship("SparePartRequest", back_populates="warehouse_item")
    invoice_items = relationship("InvoiceItem", back_populates="warehouse_item")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    invoice_number = Column(String(64), unique=True, index=True, nullable=False)
    subtotal = Column(Float, default=0.0, nullable=False)
    tax = Column(Float, default=0.0, nullable=False)
    total = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    paid = Column(Boolean, default=False)
    paid_at = Column(DateTime, nullable=True)

    job = relationship("Job", foreign_keys="Job.invoice_id", back_populates="invoice")
    items = relationship("InvoiceItem", back_populates="invoice")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    warehouse_item_id = Column(Integer, ForeignKey("warehouse_items.id"), nullable=True)
    description = Column(String(256), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    item_type = Column(String(32), nullable=False)  # labor, part, service

    invoice = relationship("Invoice", back_populates="items")
    warehouse_item = relationship("WarehouseItem", back_populates="invoice_items")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    service_type = Column(String(64), nullable=False)  # service, repair, wash, etc.
    scheduled_at = Column(DateTime, nullable=False)
    notes = Column(Text, default="")
    status = Column(String(32), default="scheduled", index=True)  # scheduled, completed, cancelled
    reminder_job_id = Column(String(128), nullable=True)

    vehicle = relationship("Vehicle", back_populates="appointments")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    channel = Column(String(32), default="log")  # sms, email, push, log
    message = Column(Text, nullable=False)
    scheduled_for = Column(DateTime, nullable=False)
    sent_at = Column(DateTime, nullable=True)


class ServiceHistory(Base):
    __tablename__ = "service_history"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    date = Column(Date, default=date.today, nullable=False)
    mileage = Column(Integer, nullable=False)
    service_type = Column(String(64), nullable=False)
    notes = Column(Text, default="")

    vehicle = relationship("Vehicle", back_populates="service_history")
