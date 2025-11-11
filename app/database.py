from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./mototrack.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    
    # Create default "Main" garage if it doesn't exist
    db = SessionLocal()
    try:
        main_garage = db.query(models.Garage).filter(models.Garage.name == "Main").first()
        if not main_garage:
            main_garage = models.Garage(name="Main", address="Main Location")
            db.add(main_garage)
            db.commit()
    finally:
        db.close()
