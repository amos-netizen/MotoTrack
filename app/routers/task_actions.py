from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import TaskAction, JobTaskAction, Job, OperationsStream, User
from app.schemas import TaskActionCreate, TaskActionOut, JobTaskActionCreate, JobTaskActionOut
from app.auth import get_current_user

router = APIRouter(prefix="/task-actions", tags=["task-actions"])


def get_user_garage_id(current_user: User):
    """Get garage_id for the current user"""
    if not current_user.garage_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be assigned to a garage"
        )
    return current_user.garage_id


@router.post("/", response_model=TaskActionOut, status_code=status.HTTP_201_CREATED)
def create_task_action(
    task_data: TaskActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new task action (admin only)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create task actions"
        )
    
    task_action = TaskAction(**task_data.dict())
    db.add(task_action)
    db.commit()
    db.refresh(task_action)
    
    return task_action


@router.get("/", response_model=List[TaskActionOut])
def list_task_actions(
    operations_stream: Optional[OperationsStream] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List task actions, optionally filtered by operations stream"""
    query = db.query(TaskAction)
    
    if operations_stream:
        query = query.filter(TaskAction.operations_stream == operations_stream)
    
    if active_only:
        query = query.filter(TaskAction.is_active == True)
    
    tasks = query.order_by(TaskAction.operations_stream, TaskAction.name).all()
    return tasks


@router.get("/{task_id}", response_model=TaskActionOut)
def get_task_action(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get task action details"""
    task = db.query(TaskAction).filter(TaskAction.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task action not found"
        )
    
    return task


@router.patch("/{task_id}", response_model=TaskActionOut)
def update_task_action(
    task_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    default_labor_cost: Optional[float] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update task action (admin only)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update task actions"
        )
    
    task = db.query(TaskAction).filter(TaskAction.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task action not found"
        )
    
    if name is not None:
        task.name = name
    if description is not None:
        task.description = description
    if default_labor_cost is not None:
        task.default_labor_cost = default_labor_cost
    if is_active is not None:
        task.is_active = is_active
    
    db.commit()
    db.refresh(task)
    
    return task


@router.post("/jobs/{job_id}/add-task", response_model=JobTaskActionOut, status_code=status.HTTP_201_CREATED)
def add_task_to_job(
    job_id: int,
    task_data: JobTaskActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a task action to a job (technician)"""
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
    
    # Verify task action exists
    task_action = db.query(TaskAction).filter(
        TaskAction.id == task_data.task_action_id,
        TaskAction.is_active == True
    ).first()
    
    if not task_action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task action not found"
        )
    
    # Check if already added
    existing = db.query(JobTaskAction).filter(
        JobTaskAction.job_id == job_id,
        JobTaskAction.task_action_id == task_data.task_action_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task already added to job"
        )
    
    # Use provided labor cost or default
    labor_cost = task_data.labor_cost if task_data.labor_cost is not None else task_action.default_labor_cost
    
    job_task = JobTaskAction(
        job_id=job_id,
        task_action_id=task_data.task_action_id,
        labor_cost=labor_cost,
        notes=task_data.notes or ""
    )
    
    db.add(job_task)
    db.commit()
    db.refresh(job_task)
    
    return job_task


@router.get("/jobs/{job_id}/tasks", response_model=List[JobTaskActionOut])
def list_job_tasks(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all task actions for a job"""
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
    
    tasks = db.query(JobTaskAction).filter(
        JobTaskAction.job_id == job_id
    ).all()
    
    return tasks


@router.patch("/jobs/{job_id}/tasks/{task_id}/complete", response_model=JobTaskActionOut)
def complete_job_task(
    job_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a job task as completed (technician)"""
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
    
    job_task = db.query(JobTaskAction).filter(
        JobTaskAction.id == task_id,
        JobTaskAction.job_id == job_id
    ).first()
    
    if not job_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job task not found"
        )
    
    job_task.completed = True
    
    db.commit()
    db.refresh(job_task)
    
    return job_task


