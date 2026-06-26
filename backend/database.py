import os
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./app.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="AI Innovator")
    age = Column(Integer, default=30)
    state = Column(String, default="Delhi")
    occupation = Column(String, default="Working Professional")
    monthly_budget = Column(Float, default=25000.0)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    due_time = Column(String, nullable=True) # e.g. "17:00"
    date = Column(String, nullable=False) # e.g. "2026-06-26"

class Reminder(Base):
    __tablename__ = "reminders"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    time = Column(String, nullable=False) # e.g. "08:00"
    type = Column(String, default="general") # "medicine", "bill", "general"
    details = Column(String, nullable=True) # e.g. "Take 1 tablet after food" or "Amount due Rs. 1500"
    is_active = Column(Boolean, default=True)

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    category = Column(String, default="other") # "bill", "prescription", "notice", "other"
    extracted_text = Column(String, nullable=True)
    summary = Column(String, nullable=True)
    file_path = Column(String, nullable=False)
    created_at = Column(String, nullable=False) # YYYY-MM-DD HH:MM:SS
    
    # Relationship to expenses if it's a bill
    expenses = relationship("Expense", back_populates="document", cascade="all, delete-orphan")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, default="Other") # "Grocery", "Electricity", "Medicine", "Rent", "Other"
    date = Column(String, nullable=False) # YYYY-MM-DD
    doc_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    
    document = relationship("Document", back_populates="expenses")

class GovernmentScheme(Base):
    __tablename__ = "government_schemes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=False)
    eligibility = Column(String, nullable=False)
    benefit = Column(String, nullable=False)
    state = Column(String, default="All") # "All" or specific state name

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
