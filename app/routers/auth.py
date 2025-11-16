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
    role: str  # technician, site_manager, workshop_manager, warehouse_manager, billing
    garage_id: int | None = None
    full_name: str | None = None
    phone: str | None = None


class CreateStaffProfilePayload(BaseModel):
    email: str
    password: str
    role: str  # technician, workshop_manager, warehouse_manager, billing, admin
    garage_id: int
    full_name: str | None = None
    phone: str | None = None


@router.post("/signup")
def signup(payload: SignupPayload, db: Session = Depends(get_db)):
    """Public signup - allows staff roles only"""
    # Validate allowed staff roles
    allowed_staff_roles = ("technician", "site_manager", "workshop_manager", "warehouse_manager", "billing")
    if payload.role not in allowed_staff_roles:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid role. Allowed roles: {', '.join(allowed_staff_roles)}"
        )
    
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Get or create Main garage if garage_id not provided
    garage_id = payload.garage_id
    if not garage_id:
        main_garage = db.query(Garage).filter(Garage.name == "Main").first()
        if main_garage:
            garage_id = main_garage.id
        else:
            # Create Main garage if it doesn't exist
            main_garage = Garage(name="Main", address="Main Location")
            db.add(main_garage)
            db.flush()
            garage_id = main_garage.id
    
    # Validate garage exists
    garage = db.query(Garage).filter(Garage.id == garage_id).first()
    if not garage:
        raise HTTPException(status_code=400, detail="Invalid garage ID")
    
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        garage_id=garage_id,
        full_name=payload.full_name,
        phone=payload.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "role": user.role, "garage_id": user.garage_id, "full_name": user.full_name, "phone": user.phone}


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
    allowed_staff_roles = ("technician", "site_manager", "workshop_manager", "warehouse_manager", "billing", "admin")
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










