from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import random
import string

from app.database import get_db
from app.models import Invoice, InvoiceItem, Job, JobStatus, WarehouseItem, JobTaskAction, TaskAction, User
from app.schemas import InvoiceCreate, InvoiceOut, InvoiceItemCreate
from app.auth import get_current_user

router = APIRouter(prefix="/billing", tags=["billing"])


def generate_invoice_number() -> str:
    """Generate unique invoice number"""
    prefix = "INV"
    date_str = datetime.utcnow().strftime("%Y%m%d")
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{date_str}-{random_str}"


def get_user_garage_id(current_user: User):
    """Get garage_id for the current user"""
    if not current_user.garage_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be assigned to a garage"
        )
    return current_user.garage_id


@router.post("/jobs/{job_id}/invoice", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def create_invoice(
    job_id: int,
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create invoice for a job (billing/admin only)"""
    if current_user.role not in ['admin', 'billing']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only billing staff can create invoices"
        )
    
    garage_id = get_user_garage_id(current_user)
    
    # Verify job exists and is ready for billing
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.garage_id == garage_id,
        Job.status == JobStatus.BILLING
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or not ready for billing"
        )
    
    # Check if invoice already exists
    if job.invoice_id:
        existing_invoice = db.query(Invoice).filter(Invoice.id == job.invoice_id).first()
        if existing_invoice:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice already exists for this job"
            )
    
    # Calculate totals
    subtotal = 0.0
    
    # Create invoice items
    invoice_items = []
    for item_data in invoice_data.items:
        if item_data.warehouse_item_id:
            # Verify warehouse item exists
            warehouse_item = db.query(WarehouseItem).filter(
                WarehouseItem.id == item_data.warehouse_item_id
            ).first()
            if not warehouse_item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Warehouse item {item_data.warehouse_item_id} not found"
                )
        
        total = item_data.quantity * item_data.unit_price
        subtotal += total
        
        invoice_items.append({
            'warehouse_item_id': item_data.warehouse_item_id,
            'description': item_data.description,
            'quantity': item_data.quantity,
            'unit_price': item_data.unit_price,
            'total': total,
            'item_type': item_data.item_type
        })
    
    # Calculate tax and total
    tax = subtotal * (invoice_data.tax_rate / 100)
    total = subtotal + tax
    
    # Create invoice
    invoice = Invoice(
        job_id=job_id,
        invoice_number=generate_invoice_number(),
        subtotal=subtotal,
        tax=tax,
        total=total
    )
    db.add(invoice)
    db.flush()
    
    # Create invoice items
    for item_data in invoice_items:
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            **item_data
        )
        db.add(invoice_item)
    
    # Update job
    job.invoice_id = invoice.id
    job.status = JobStatus.INVOICED
    
    db.commit()
    db.refresh(invoice)
    
    return invoice


@router.post("/jobs/{job_id}/auto-invoice", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def create_auto_invoice(
    job_id: int,
    tax_rate: float = 0.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Automatically create invoice from job (includes all parts and labor)"""
    if current_user.role not in ['admin', 'billing']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only billing staff can create invoices"
        )
    
    garage_id = get_user_garage_id(current_user)
    
    # Verify job exists and is ready for billing
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.garage_id == garage_id,
        Job.status == JobStatus.BILLING
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or not ready for billing"
        )
    
    # Check if invoice already exists
    if job.invoice_id:
        existing_invoice = db.query(Invoice).filter(Invoice.id == job.invoice_id).first()
        if existing_invoice:
            return existing_invoice
    
    invoice_items = []
    
    # Add labor costs from task actions
    task_actions = db.query(JobTaskAction).join(TaskAction).filter(
        JobTaskAction.job_id == job_id,
        JobTaskAction.completed == True
    ).all()
    
    for task_action in task_actions:
        labor_cost = task_action.labor_cost or task_action.task_action.default_labor_cost
        if labor_cost > 0:
            invoice_items.append(InvoiceItemCreate(
                description=f"Labor: {task_action.task_action.name}",
                quantity=1,
                unit_price=labor_cost,
                item_type="labor"
            ))
    
    # Add parts from spare part requests
    from app.models import SparePartRequest, RequestStatus
    parts_requests = db.query(SparePartRequest).filter(
        SparePartRequest.job_id == job_id,
        SparePartRequest.status == RequestStatus.COMPLETED
    ).all()
    
    for request in parts_requests:
        warehouse_item = request.warehouse_item
        invoice_items.append(InvoiceItemCreate(
            warehouse_item_id=warehouse_item.id,
            description=f"{warehouse_item.name}",
            quantity=request.quantity,
            unit_price=warehouse_item.unit_price,
            item_type="part"
        ))
    
    if not invoice_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No items to invoice"
        )
    
    # Create invoice
    invoice_data = InvoiceCreate(
        job_id=job_id,
        items=invoice_items,
        tax_rate=tax_rate
    )
    
    return create_invoice(job_id, invoice_data, db, current_user)


@router.get("/invoices", response_model=List[InvoiceOut])
def list_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all invoices"""
    garage_id = get_user_garage_id(current_user)
    
    invoices = db.query(Invoice).join(Job).filter(
        Job.garage_id == garage_id
    ).order_by(Invoice.created_at.desc()).all()
    
    return invoices


@router.get("/invoices/{invoice_id}", response_model=InvoiceOut)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get invoice details"""
    garage_id = get_user_garage_id(current_user)
    
    invoice = db.query(Invoice).join(Job).filter(
        Invoice.id == invoice_id,
        Job.garage_id == garage_id
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return invoice


@router.post("/invoices/{invoice_id}/mark-paid", response_model=InvoiceOut)
def mark_invoice_paid(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark invoice as paid"""
    garage_id = get_user_garage_id(current_user)
    
    invoice = db.query(Invoice).join(Job).filter(
        Invoice.id == invoice_id,
        Job.garage_id == garage_id
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    invoice.paid = True
    invoice.paid_at = datetime.utcnow()
    
    db.commit()
    db.refresh(invoice)
    
    return invoice


