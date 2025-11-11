from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import Garage
from app.auth import require_role

router = APIRouter()


class GarageCreate(BaseModel):
    name: str
    address: str | None = ""


@router.post("/", dependencies=[Depends(require_role("admin"))])
def create_garage(payload: GarageCreate, db: Session = Depends(get_db)):
    if db.query(Garage).filter(Garage.name == payload.name).first():
        raise HTTPException(status_code=400, detail="Garage already exists")
    g = Garage(name=payload.name, address=payload.address or "")
    db.add(g)
    db.commit()
    db.refresh(g)
    return {"id": g.id, "name": g.name, "address": g.address}


@router.get("/")
def list_garages(db: Session = Depends(get_db)):
    return db.query(Garage).order_by(Garage.name.asc()).all()






