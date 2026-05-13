#!/usr/bin/env python3
"""Create or update brief demo users. Run from repo root: python scripts/seed_demo_users.py"""

import os
import sys

# Repo root on path
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

os.chdir(ROOT)

from app.database import SessionLocal, init_db  # noqa: E402
from app.models import Garage, User  # noqa: E402
from app.auth import get_password_hash  # noqa: E402

# (email, password, role) — keep passwords short for demo only
DEMO = [
    ("ad@d.co", "d1", "admin"),
    ("sm@d.co", "d1", "site_manager"),
    ("tc@d.co", "d1", "technician"),
    ("wm@d.co", "d1", "workshop_manager"),
    ("wh@d.co", "d1", "warehouse_manager"),
    ("bl@d.co", "d1", "billing"),
]


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        garage = db.query(Garage).filter(Garage.name == "Main").first()
        if not garage:
            garage = Garage(name="Main", address="Main Location")
            db.add(garage)
            db.flush()

        gid = garage.id
        for email, password, role in DEMO:
            user = db.query(User).filter(User.email == email).first()
            h = get_password_hash(password)
            if user:
                user.hashed_password = h
                user.role = role
                user.garage_id = gid
            else:
                db.add(
                    User(
                        email=email,
                        hashed_password=h,
                        role=role,
                        garage_id=gid,
                    )
                )
        db.commit()
        print("OK: demo users upserted.")
        for email, password, role in DEMO:
            print(f"  {role:20}  {email}  /  {password}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
