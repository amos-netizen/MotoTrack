from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import User, Garage
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter()


class SignupPayload(BaseModel):
    email: str
    password: str
    role: str = "client"  # client, staff, admin
    garage_id: int | None = None


class CreateStaffProfilePayload(BaseModel):
    email: str
    password: str
    role: str  # technician, workshop_manager, warehouse_manager, billing, admin
    garage_id: int
    full_name: str | None = None
    phone: str | None = None


@router.post("/signup")
def signup(payload: SignupPayload, db: Session = Depends(get_db)):
    """Public signup - only allows client role"""
    # Only allow client role for public signup
    if payload.role != "client":
        raise HTTPException(status_code=403, detail="Only client accounts can be created through public signup. Staff profiles must be created by an admin.")
    
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        garage_id=None,  # Clients don't need a garage
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "role": user.role, "garage_id": user.garage_id}


@router.post("/create-staff-profile")
def create_staff_profile(
    payload: CreateStaffProfilePayload, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create staff profiles - only accessible by admin/operation_manager"""
    # Only admin can create staff profiles
    if current_user.role not in ("admin", "operation_manager"):
        raise HTTPException(status_code=403, detail="Only Operation Manager/Admin can create staff profiles")
    
    # Validate allowed roles
    allowed_staff_roles = ("technician", "workshop_manager", "warehouse_manager", "billing", "admin")
    if payload.role not in allowed_staff_roles:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid role. Allowed roles: {', '.join(allowed_staff_roles)}"
        )
    
    # Check if email already exists
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate garage exists
    garage = db.query(Garage).filter(Garage.id == payload.garage_id).first()
    if not garage:
        raise HTTPException(status_code=400, detail="Invalid garage ID")
    
    # Create user
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        garage_id=payload.garage_id,
        full_name=payload.full_name,
        phone=payload.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "id": user.id, 
        "email": user.email, 
        "role": user.role, 
        "garage_id": user.garage_id,
        "full_name": user.full_name,
        "phone": user.phone
    }


@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "role": user.role, "garage_id": user.garage_id, "full_name": user.full_name, "phone": user.phone}


@router.get("/users")
def list_users(role: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List users, optionally filtered by role. Only accessible to authenticated users."""
    query = db.query(User)
    
    # Filter by garage if user has a garage
    if current_user.garage_id:
        query = query.filter(User.garage_id == current_user.garage_id)
    
    # Filter by role if provided
    if role:
        query = query.filter(User.role == role)
    
    users = query.all()
    return [{"id": u.id, "email": u.email, "role": u.role, "garage_id": u.garage_id, "full_name": u.full_name, "phone": u.phone} for u in users]










