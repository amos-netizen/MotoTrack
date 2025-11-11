from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.database import get_db
from app.models import SparePartRequest, Job, WarehouseItem, User, RequestStatus, JobStatus
from app.schemas import SparePartRequestCreate, SparePartRequestOut
from app.auth import get_current_user

router = APIRouter(prefix="/spare-parts", tags=["spare-parts"])


def get_user_garage_id(current_user: User):
    """Get garage_id for the current user"""
    if not current_user.garage_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be assigned to a garage"
        )
    return current_user.garage_id


@router.post("/jobs/{job_id}/request", response_model=SparePartRequestOut, status_code=status.HTTP_201_CREATED)
def create_spare_part_request(
    job_id: int,
    request_data: SparePartRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Technician requests spare parts for a job"""
    garage_id = get_user_garage_id(current_user)
    
    # Verify job exists and belongs to technician
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.garage_id == garage_id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if current_user.role == 'technician' and job.technician_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Verify warehouse item exists
    warehouse_item = db.query(WarehouseItem).filter(
        WarehouseItem.id == request_data.warehouse_item_id
    ).first()
    
    if not warehouse_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse item not found"
        )
    
    # Check stock availability
    if warehouse_item.quantity_in_stock < request_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {warehouse_item.quantity_in_stock}"
        )
    
    # Create request
    request = SparePartRequest(
        job_id=job_id,
        warehouse_item_id=request_data.warehouse_item_id,
        quantity=request_data.quantity,
        requested_by_id=current_user.id,
        status=RequestStatus.PENDING,
        notes=request_data.notes
    )
    
    # Update job status if needed
    if job.status == JobStatus.IN_PROGRESS:
        job.status = JobStatus.AWAITING_PARTS
    
    db.add(request)
    db.commit()
    db.refresh(request)
    
    return request


@router.get("/jobs/{job_id}", response_model=List[SparePartRequestOut])
def list_job_requests(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all spare part requests for a job"""
    garage_id = get_user_garage_id(current_user)
    
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.garage_id == garage_id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    requests = db.query(SparePartRequest).filter(
        SparePartRequest.job_id == job_id
    ).all()
    
    return requests


@router.post("/requests/{request_id}/approve", response_model=SparePartRequestOut)
def approve_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Workshop manager approves spare part request"""
    if current_user.role not in ['workshop_manager', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workshop managers can approve requests"
        )
    
    garage_id = get_user_garage_id(current_user)
    
    request = db.query(SparePartRequest).join(Job).filter(
        SparePartRequest.id == request_id,
        Job.garage_id == garage_id,
        SparePartRequest.status == RequestStatus.PENDING
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found or already processed"
        )
    
    request.status = RequestStatus.APPROVED
    request.approved_by_id = current_user.id
    request.approved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(request)
    
    return request


@router.post("/requests/{request_id}/reject", response_model=SparePartRequestOut)
def reject_request(
    request_id: int,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Workshop manager rejects spare part request"""
    if current_user.role not in ['workshop_manager', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workshop managers can reject requests"
        )
    
    garage_id = get_user_garage_id(current_user)
    
    request = db.query(SparePartRequest).join(Job).filter(
        SparePartRequest.id == request_id,
        Job.garage_id == garage_id,
        SparePartRequest.status == RequestStatus.PENDING
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found or already processed"
        )
    
    request.status = RequestStatus.REJECTED
    request.approved_by_id = current_user.id
    request.approved_at = datetime.utcnow()
    if notes:
        request.notes = f"{request.notes}\nRejection reason: {notes}"
    
    db.commit()
    db.refresh(request)
    
    return request


@router.post("/requests/{request_id}/issue", response_model=SparePartRequestOut)
def issue_parts(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Warehouse manager issues spare parts"""
    if current_user.role not in ['warehouse_manager', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only warehouse managers can issue parts"
        )
    
    garage_id = get_user_garage_id(current_user)
    
    request = db.query(SparePartRequest).join(Job).filter(
        SparePartRequest.id == request_id,
        Job.garage_id == garage_id,
        SparePartRequest.status == RequestStatus.APPROVED
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found or not approved"
        )
    
    warehouse_item = request.warehouse_item
    
    # Check stock availability
    if warehouse_item.quantity_in_stock < request.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {warehouse_item.quantity_in_stock}"
        )
    
    # Deduct from stock
    warehouse_item.quantity_in_stock -= request.quantity
    
    # Update request
    request.status = RequestStatus.ISSUED
    request.issued_by_id = current_user.id
    request.issued_at = datetime.utcnow()
    
    # Update job status if all parts are issued
    job = request.job
    pending_requests = db.query(SparePartRequest).filter(
        SparePartRequest.job_id == job.id,
        SparePartRequest.status.in_([RequestStatus.PENDING, RequestStatus.APPROVED])
    ).count()
    
    if pending_requests == 0 and job.status == JobStatus.AWAITING_PARTS:
        job.status = JobStatus.IN_PROGRESS
    
    db.commit()
    db.refresh(request)
    
    return request


@router.post("/requests/{request_id}/complete", response_model=SparePartRequestOut)
def complete_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark request as completed (after parts are used)"""
    garage_id = get_user_garage_id(current_user)
    
    request = db.query(SparePartRequest).join(Job).filter(
        SparePartRequest.id == request_id,
        Job.garage_id == garage_id,
        SparePartRequest.status == RequestStatus.ISSUED
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found or not issued"
        )
    
    request.status = RequestStatus.COMPLETED
    
    db.commit()
    db.refresh(request)
    
    return request


@router.get("/pending", response_model=List[SparePartRequestOut])
def list_pending_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List pending requests based on role"""
    garage_id = get_user_garage_id(current_user)
    
    query = db.query(SparePartRequest).join(Job).filter(
        Job.garage_id == garage_id
    )
    
    if current_user.role == 'workshop_manager':
        # Show pending requests for approval
        query = query.filter(SparePartRequest.status == RequestStatus.PENDING)
    elif current_user.role == 'warehouse_manager':
        # Show approved requests for issuing
        query = query.filter(SparePartRequest.status == RequestStatus.APPROVED)
    else:
        # Technicians see their own requests
        query = query.filter(SparePartRequest.requested_by_id == current_user.id)
    
    requests = query.order_by(SparePartRequest.requested_at.desc()).all()
    return requests


