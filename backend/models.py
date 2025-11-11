from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Date, Text
from sqlalchemy.orm import relationship

from app.database import Base
from sqlalchemy import UniqueConstraint


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vin = Column(String(32), unique=True, index=True, nullable=False)
    owner_name = Column(String(128), nullable=False)
    owner_contact = Column(String(128), nullable=False)
    current_mileage = Column(Integer, default=0, nullable=False)

    service_orders = relationship("ServiceOrder", back_populates="vehicle")
    appointments = relationship("Appointment", back_populates="vehicle")
    service_history = relationship("ServiceHistory", back_populates="vehicle")


class Garage(Base):
    __tablename__ = "garages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), unique=True, nullable=False)
    address = Column(String(256), default="")

    orders = relationship("ServiceOrder", back_populates="garage")
    staff = relationship("User", back_populates="garage")


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint('email', name='uq_users_email'),)

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(128), nullable=False)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), nullable=False, default='client')  # client, staff, admin
    garage_id = Column(Integer, ForeignKey("garages.id"), nullable=True)

    garage = relationship("Garage", back_populates="staff")


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
