from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import WarehouseItem, User
from app.schemas import WarehouseItemCreate, WarehouseItemUpdate, WarehouseItemOut
from app.auth import get_current_user

router = APIRouter(prefix="/warehouse", tags=["warehouse"])


@router.post("/items", response_model=WarehouseItemOut, status_code=status.HTTP_201_CREATED)
def create_warehouse_item(
    item_data: WarehouseItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new warehouse item (admin/warehouse manager only)"""
    if current_user.role not in ['warehouse_manager', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only warehouse managers and admins can create items"
        )
    
    # Check if part_number already exists
    if item_data.part_number:
        existing = db.query(WarehouseItem).filter(
            WarehouseItem.part_number == item_data.part_number
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Part number already exists"
            )
    
    item = WarehouseItem(**item_data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return item


@router.get("/items", response_model=List[WarehouseItemOut])
def list_warehouse_items(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all warehouse items"""
    query = db.query(WarehouseItem)
    
    if active_only:
        query = query.filter(WarehouseItem.is_active == True)
    
    items = query.order_by(WarehouseItem.name).all()
    return items


@router.get("/items/{item_id}", response_model=WarehouseItemOut)
def get_warehouse_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get warehouse item details"""
    item = db.query(WarehouseItem).filter(WarehouseItem.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    return item


@router.patch("/items/{item_id}", response_model=WarehouseItemOut)
def update_warehouse_item(
    item_id: int,
    update_data: WarehouseItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update warehouse item (admin/warehouse manager only)"""
    if current_user.role not in ['warehouse_manager', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only warehouse managers and admins can update items"
        )
    
    item = db.query(WarehouseItem).filter(WarehouseItem.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Check part_number uniqueness if updating
    if update_data.part_number and update_data.part_number != item.part_number:
        existing = db.query(WarehouseItem).filter(
            WarehouseItem.part_number == update_data.part_number,
            WarehouseItem.id != item_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Part number already exists"
            )
    
    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    
    return item


@router.get("/items/low-stock", response_model=List[WarehouseItemOut])
def list_low_stock_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List items that are below reorder level"""
    items = db.query(WarehouseItem).filter(
        WarehouseItem.quantity_in_stock <= WarehouseItem.reorder_level,
        WarehouseItem.is_active == True
    ).order_by(WarehouseItem.quantity_in_stock).all()
    
    return items


