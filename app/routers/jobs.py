from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
from typing import Optional, List

from app.database import get_db
from app.models import Job, Vehicle, User, JobStatus, OperationsStream, RevenueStream, SparePartRequest, RequestStatus
from app.schemas import JobCreate, JobOut, JobAssign, JobUpdate, JobDetailOut, VehicleCreate, VehicleOut
from app.auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["jobs"])


def get_user_garage_id(current_user: User):
    """Get garage_id for the current user, raise error if not set"""
    if not current_user.garage_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be assigned to a garage"
        )
    return current_user.garage_id


@router.post("/", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Site manager creates a new job when vehicle arrives"""
    # Check if user is site_manager
    if current_user.role not in ['site_manager', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only site managers can create jobs"
        )
    
    garage_id = get_user_garage_id(current_user)
    
    # Check if vehicle exists, create if not
    vehicle = db.query(Vehicle).filter(
        Vehicle.registration_number == job_data.registration_number
    ).first()
    
    if not vehicle:
        # Create new vehicle
        vehicle = Vehicle(
            registration_number=job_data.registration_number,
            vin=job_data.vin,
            owner_name=job_data.owner_name,
            owner_contact=job_data.owner_contact,
            current_mileage=job_data.current_mileage,
            make=job_data.make,
            model=job_data.model,
            year=job_data.year
        )
        db.add(vehicle)
        db.flush()
    
    # Create job
    job = Job(
        vehicle_id=vehicle.id,
        garage_id=garage_id,
        site_manager_id=current_user.id,
        operations_stream=job_data.operations_stream,
        revenue_stream=job_data.revenue_stream,
        issues_reported=job_data.issues_reported,
        status=JobStatus.RECEIVED
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    return job


@router.get("/", response_model=List[JobOut])
def list_jobs(
    status_filter: Optional[JobStatus] = None,
    operations_stream: Optional[OperationsStream] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List jobs - filtered by role"""
    garage_id = get_user_garage_id(current_user)
    
    query = db.query(Job).filter(Job.garage_id == garage_id)
    
    # Filter by status
    if status_filter:
        query = query.filter(Job.status == status_filter)
    
    # Filter by operations stream
    if operations_stream:
        query = query.filter(Job.operations_stream == operations_stream)
    
    # Technicians only see their assigned jobs
    if current_user.role == 'technician':
        query = query.filter(Job.technician_id == current_user.id)
    
    jobs = query.order_by(Job.created_at.desc()).all()
    return jobs


@router.get("/{job_id}", response_model=JobDetailOut)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get job details"""
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
    
    # Check access for technicians
    if current_user.role == 'technician' and job.technician_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return job


@router.post("/{job_id}/assign", response_model=JobOut)
def assign_job(
    job_id: int,
    assign_data: JobAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Site manager assigns job to technician"""
    if current_user.role not in ['site_manager', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only site managers can assign jobs"
        )
    
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
    
    # Verify technician exists and belongs to same garage
    technician = db.query(User).filter(
        User.id == assign_data.technician_id,
        User.garage_id == garage_id,
        User.role == 'technician'
    ).first()
    
    if not technician:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Technician not found"
        )
    
    job.technician_id = assign_data.technician_id
    job.status = JobStatus.ASSIGNED
    job.assigned_at = datetime.utcnow()
    
    db.commit()
    db.refresh(job)
    
    return job


@router.patch("/{job_id}", response_model=JobOut)
def update_job(
    job_id: int,
    update_data: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Technician updates job (work done, status)"""
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
    
    # Technicians can only update their own jobs
    if current_user.role == 'technician' and job.technician_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if update_data.work_done is not None:
        job.work_done = update_data.work_done
    
    if update_data.status:
        # Check if there are pending parts requests
        if update_data.status == JobStatus.COMPLETED:
            pending_requests = db.query(SparePartRequest).filter(
                SparePartRequest.job_id == job_id,
                SparePartRequest.status.in_([RequestStatus.PENDING, RequestStatus.APPROVED])
            ).count()
            
            if pending_requests > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot complete job with pending parts requests"
                )
        
        job.status = update_data.status
        
        if update_data.status == JobStatus.COMPLETED:
            job.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(job)
    
    return job


@router.post("/{job_id}/complete", response_model=JobOut)
def complete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Technician marks job as complete"""
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
    
    if current_user.role == 'technician' and job.technician_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Check for pending parts requests
    pending_requests = db.query(SparePartRequest).filter(
        SparePartRequest.job_id == job_id,
        SparePartRequest.status.in_([RequestStatus.PENDING, RequestStatus.APPROVED])
    ).count()
    
    if pending_requests > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot complete job with pending parts requests"
        )
    
    job.status = JobStatus.COMPLETED
    job.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(job)
    
    return job


@router.post("/{job_id}/manager-review", response_model=JobOut)
def manager_review(
    job_id: int,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Workshop manager reviews and confirms completion, moves to billing"""
    if current_user.role not in ['workshop_manager', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workshop managers can review jobs"
        )
    
    garage_id = get_user_garage_id(current_user)
    
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.garage_id == garage_id,
        Job.status == JobStatus.COMPLETED
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or not completed"
        )
    
    if notes:
        job.manager_notes = notes
    
    job.status = JobStatus.MANAGER_REVIEW
    
    db.commit()
    db.refresh(job)
    
    return job


@router.post("/{job_id}/move-to-billing", response_model=JobOut)
def move_to_billing(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Workshop manager moves job to billing"""
    if current_user.role not in ['workshop_manager', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workshop managers can move jobs to billing"
        )
    
    garage_id = get_user_garage_id(current_user)
    
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.garage_id == garage_id,
        Job.status == JobStatus.MANAGER_REVIEW
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or not ready for billing"
        )
    
    job.status = JobStatus.BILLING
    
    db.commit()
    db.refresh(job)
    
    return job

