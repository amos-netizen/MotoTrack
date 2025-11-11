# Operations Management System Documentation

## Overview

This is a comprehensive operations management system for an autogarage that handles the complete workflow from vehicle arrival to invoicing.

## System Architecture

### Main Functions
1. **Workshop** - Job management and technician workflow
2. **Warehouse** - Inventory and spare parts management
3. **Administration** - User management and approvals
4. **Billing** - Invoice generation and payment tracking

### Operations Streams
- **Body Works** - Body repairs, painting, dent removal
- **Mechanical Works** - Engine, transmission, brakes
- **Electrical Works** - Wiring, battery, alternator
- **Interior Works** - Upholstery, dashboard, interior repairs

### Revenue Streams
- **Walk-in** - Customers arriving without appointment
- **Scheduled Service** - Pre-booked appointments
- **Spare Parts** - Parts-only sales

## User Roles

1. **Site Manager** - Receives vehicles, creates jobs, assigns to technicians
2. **Technician** - Works on vehicles, requests parts, marks tasks complete
3. **Workshop Manager** - Approves parts requests, reviews completed work, moves to billing
4. **Warehouse Manager** - Manages inventory, issues parts
5. **Billing Staff** - Creates invoices, tracks payments
6. **Admin** - Full system access, manages task actions

## Workflow

### 1. Vehicle Arrival (Site Manager)
- Site manager receives client
- Captures vehicle details:
  - Registration number (required, unique)
  - VIN (optional)
  - Owner name and contact
  - Make, model, year (optional)
  - Current mileage
- Listens to issues reported by owner
- Creates job with:
  - Operations stream (body/mechanical/electrical/interior)
  - Revenue stream (walk-in/scheduled/spare parts)
  - Issues reported
- Job status: `RECEIVED`

### 2. Job Assignment (Site Manager)
- Assigns job to technician based on operations stream
- Job status: `ASSIGNED`
- Technician receives notification

### 3. Work in Progress (Technician)
- Technician starts work
- Job status: `IN_PROGRESS`
- Technician can:
  - Add task actions (specific work items)
  - Request spare parts
  - Update work done notes
  - Mark task actions as complete

### 4. Spare Parts Request Workflow

#### Technician Requests Parts
- Creates request for warehouse item
- Specifies quantity needed
- Job status: `AWAITING_PARTS` (if parts needed)

#### Workshop Manager Approves
- Reviews request
- Approves or rejects
- Request status: `APPROVED` or `REJECTED`

#### Warehouse Manager Issues Parts
- Verifies stock availability
- Deducts from inventory
- Issues parts
- Request status: `ISSUED`
- Job status returns to: `IN_PROGRESS` (if all parts issued)

### 5. Job Completion (Technician)
- Technician marks all tasks complete
- Updates work done notes
- Marks job as complete
- Job status: `COMPLETED`
- Cannot complete if pending parts requests exist

### 6. Manager Review (Workshop Manager)
- Reviews completed work
- Adds manager notes
- Confirms completion
- Job status: `MANAGER_REVIEW`

### 7. Move to Billing (Workshop Manager)
- Moves job to billing queue
- Job status: `BILLING`

### 8. Invoice Creation (Billing Staff)
- Creates invoice automatically or manually
- Includes:
  - Labor costs (from completed task actions)
  - Parts costs (from issued spare parts)
  - Tax calculation
- Generates unique invoice number
- Job status: `INVOICED`

### 9. Payment Tracking
- Mark invoice as paid
- Record payment date

## Database Models

### Core Models

1. **Vehicle**
   - Registration number (unique)
   - VIN, owner details, vehicle info

2. **Job**
   - Links vehicle to garage, site manager, technician
   - Operations stream, revenue stream
   - Status tracking
   - Work done, manager notes

3. **TaskAction**
   - Predefined actions for each operations stream
   - Default labor costs
   - Can be activated/deactivated

4. **JobTaskAction**
   - Links tasks to jobs
   - Tracks completion
   - Custom labor costs

5. **SparePartRequest**
   - Links job to warehouse item
   - Approval workflow
   - Quantity tracking

6. **WarehouseItem**
   - Inventory management
   - Stock levels, reorder points
   - Pricing

7. **Invoice**
   - Links to job
   - Invoice items (labor, parts, services)
   - Tax calculation
   - Payment tracking

## API Endpoints

### Jobs (`/api/jobs`)
- `POST /` - Create job (Site Manager)
- `GET /` - List jobs (filtered by role)
- `GET /{job_id}` - Get job details
- `POST /{job_id}/assign` - Assign to technician
- `PATCH /{job_id}` - Update job (Technician)
- `POST /{job_id}/complete` - Mark complete
- `POST /{job_id}/manager-review` - Manager review
- `POST /{job_id}/move-to-billing` - Move to billing

### Spare Parts (`/api/spare-parts`)
- `POST /jobs/{job_id}/request` - Request parts
- `GET /jobs/{job_id}` - List job requests
- `POST /requests/{request_id}/approve` - Approve request
- `POST /requests/{request_id}/reject` - Reject request
- `POST /requests/{request_id}/issue` - Issue parts
- `POST /requests/{request_id}/complete` - Mark complete
- `GET /pending` - List pending requests

### Warehouse (`/api/warehouse`)
- `POST /items` - Create item
- `GET /items` - List items
- `GET /items/{item_id}` - Get item details
- `PATCH /items/{item_id}` - Update item
- `GET /items/low-stock` - List low stock items

### Billing (`/api/billing`)
- `POST /jobs/{job_id}/invoice` - Create invoice manually
- `POST /jobs/{job_id}/auto-invoice` - Auto-create invoice
- `GET /invoices` - List invoices
- `GET /invoices/{invoice_id}` - Get invoice
- `POST /invoices/{invoice_id}/mark-paid` - Mark paid

### Task Actions (`/api/task-actions`)
- `POST /` - Create task action (Admin)
- `GET /` - List task actions
- `GET /{task_id}` - Get task action
- `PATCH /{task_id}` - Update task action
- `POST /jobs/{job_id}/add-task` - Add task to job
- `GET /jobs/{job_id}/tasks` - List job tasks
- `PATCH /jobs/{job_id}/tasks/{task_id}/complete` - Complete task

## Task Actions Management

Task actions are predefined work items that can be added to jobs. They are organized by operations stream:

### Example Task Actions

**Body Works:**
- Dent removal
- Panel replacement
- Paint job
- Bumper repair

**Mechanical Works:**
- Engine repair
- Oil change
- Brake service
- Transmission service

**Electrical Works:**
- Battery replacement
- Alternator repair
- Wiring repair
- ECU diagnostics

**Interior Works:**
- Upholstery repair
- Dashboard repair
- Carpet replacement
- Seat adjustment

Each task action has:
- Name and description
- Default labor cost
- Active/inactive status

## Security & Access Control

- All endpoints require authentication
- Role-based access control enforced
- Users can only access their garage's data
- Technicians can only see/modify their assigned jobs

## Next Steps

1. Create frontend interfaces for each role
2. Add notifications for status changes
3. Add reporting and analytics
4. Add inventory alerts for low stock
5. Add customer portal for job tracking

## Database Migration

When you first run the system, the database will be automatically created with all tables. If you need to reset:

```bash
rm mototrack.db
# Restart the server to recreate database
```

## Testing the System

1. Create users with different roles
2. Create a garage
3. Create warehouse items
4. Create task actions for each operations stream
5. Test the complete workflow:
   - Site manager creates job
   - Assigns to technician
   - Technician requests parts
   - Workshop manager approves
   - Warehouse manager issues
   - Technician completes
   - Manager reviews
   - Move to billing
   - Create invoice


