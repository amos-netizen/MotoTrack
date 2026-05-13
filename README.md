# MotoTrack Service Assistant

A FastAPI-based assistant to manage car service orders, appointments, reminders, and next-service recommendations.

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API root: `http://localhost:8000` (docs at `/docs`)

## Endpoints

- POST `/orders/` – Create a service order by `vehicle_vin`
- PATCH `/orders/{order_id}/status` – Update status; triggers ready-for-pickup notification when set to `ready`
- GET `/orders/` – List orders
- GET `/orders/{order_id}` – Get order

- POST `/appointments/` – Book appointment with `vehicle_vin`, `service_type`, `scheduled_at`
- PATCH `/appointments/{appointment_id}` – Reschedule/update/cancel; reminder updates automatically (24h before)
- GET `/appointments/` – List appointments
- GET `/appointments/{appointment_id}` – Get appointment

- GET `/appointments/next-service/recommendation/{vehicle_vin}` – Next service recommendation

## Examples

Create order:
```bash
curl -sX POST localhost:8000/orders/ \
 -H 'Content-Type: application/json' \
 -d '{"vehicle_vin":"VIN123","work_requested":"Oil change and inspection"}' | jq
```

Mark ready (sends notification):
```bash
curl -sX PATCH localhost:8000/orders/1/status \
 -H 'Content-Type: application/json' \
 -d '{"status":"ready","work_done":"Oil + filter changed","final_cost":120.5,"mechanic_notes":"No issues"}' | jq
```

Book appointment:
```bash
ISO=$(date -u -d "+2 days" +%Y-%m-%dT%H:%M:%SZ)
curl -sX POST localhost:8000/appointments/ \
 -H 'Content-Type: application/json' \
 -d '{"vehicle_vin":"VIN123","service_type":"Service","scheduled_at":"'"$ISO"'"}' | jq
```

Reschedule appointment:
```bash
ISO2=$(date -u -d "+3 days" +%Y-%m-%dT%H:%M:%SZ)
curl -sX PATCH localhost:8000/appointments/1 \
 -H 'Content-Type: application/json' \
 -d '{"scheduled_at":"'"$ISO2"'"}' | jq
```

Next service recommendation:
```bash
curl -s localhost:8000/appointments/next-service/recommendation/VIN123 | jq
```

Notes:
- Notifications currently log to console. Integrate real SMS/Email in `app/notifications.py`.
- Reminders are processed every 30 seconds by the background scheduler.

## Frontend

Scaffolded in `frontend/` (Vite + React + TS).

Run:
```bash
cd frontend
npm install
npm run dev
```

Pages:
- `/` dashboard with health and links
- `/orders` manage service orders
- `/appointments` manage appointments
- `/recommendation` next service recommendation

## Deployment (Docker)

Run in production mode with Docker:

```bash
docker compose up -d --build
```

Then open `http://localhost`.

Notes:
- Frontend proxies API requests from `/api/*` to backend service.
- Backend persists SQLite DB in Docker volume `mototrack_data`.
- Configure backend environment using `.env.example` values (`DATABASE_URL`, `CORS_ORIGINS`).

## Deployment (Render)

This repo is ready for Render Blueprint deploy via `render.yaml`.

1. Push your latest code to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Select this repository and branch.
4. Render will create:
   - `mototrack-api` (Python web service)
   - `mototrack-web` (static frontend)
   - `mototrack-db` (PostgreSQL database)

Important:
- Frontend gets `VITE_API_BASE` from backend service URL automatically.
- Backend reads `DATABASE_URL` from Render Postgres.
- `CORS_ORIGINS` is currently set to `*` in blueprint; tighten it later to your frontend URL for stricter security.
