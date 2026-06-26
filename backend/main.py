import os
import shutil
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional

import database as db_mod
import schemas
import ai_service

# Initialize FastAPI App
app = FastAPI(title="LifePilot AI API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory for document uploads
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount uploads static files so frontend can display uploaded receipts
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.on_event("startup")
def startup_event():
    # Ensure database is initialized
    db_mod.init_db()
    
    # Import and run seed to ensure data is present
    from seed import seed_data
    seed_data()

# ----------------- USER PROFILE ROUTES -----------------
@app.get("/api/user", response_model=schemas.UserResponse)
def get_user_profile(db: Session = Depends(db_mod.get_db)):
    user = db.query(db_mod.User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/api/user", response_model=schemas.UserResponse)
def update_user_profile(user_data: schemas.UserCreate, db: Session = Depends(db_mod.get_db)):
    user = db.query(db_mod.User).first()
    if not user:
        user = db_mod.User()
        db.add(user)
    
    user.name = user_data.name
    user.age = user_data.age
    user.state = user_data.state
    user.occupation = user_data.occupation
    user.monthly_budget = user_data.monthly_budget
    
    db.commit()
    db.refresh(user)
    return user

# ----------------- DAILY PLANNER (TASX) ROUTES -----------------
@app.get("/api/tasks", response_model=List[schemas.TaskResponse])
def get_tasks(date: Optional[str] = None, db: Session = Depends(db_mod.get_db)):
    query = db.query(db_mod.Task)
    if date:
        query = query.filter(db_mod.Task.date == date)
    return query.order_by(db_mod.Task.due_time.asc()).all()

@app.post("/api/tasks", response_model=schemas.TaskResponse)
def create_task(task_data: schemas.TaskCreate, db: Session = Depends(db_mod.get_db)):
    task = db_mod.Task(
        title=task_data.title,
        due_time=task_data.due_time,
        date=task_data.date,
        is_completed=False
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@app.put("/api/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task_data: schemas.TaskUpdate, db: Session = Depends(db_mod.get_db)):
    task = db.query(db_mod.Task).filter(db_mod.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.is_completed is not None:
        task.is_completed = task_data.is_completed
    if task_data.due_time is not None:
        task.due_time = task_data.due_time
    if task_data.date is not None:
        task.date = task_data.date
        
    db.commit()
    db.refresh(task)
    return task

@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(db_mod.get_db)):
    task = db.query(db_mod.Task).filter(db_mod.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return None

# ----------------- SMART REMINDERS ROUTES -----------------
@app.get("/api/reminders", response_model=List[schemas.ReminderResponse])
def get_reminders(type: Optional[str] = None, db: Session = Depends(db_mod.get_db)):
    query = db.query(db_mod.Reminder)
    if type:
        query = query.filter(db_mod.Reminder.type == type)
    return query.order_by(db_mod.Reminder.time.asc()).all()

@app.post("/api/reminders", response_model=schemas.ReminderResponse)
def create_reminder(rem_data: schemas.ReminderCreate, db: Session = Depends(db_mod.get_db)):
    reminder = db_mod.Reminder(
        title=rem_data.title,
        time=rem_data.time,
        type=rem_data.type,
        details=rem_data.details,
        is_active=True
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder

@app.put("/api/reminders/{rem_id}", response_model=schemas.ReminderResponse)
def update_reminder(rem_id: int, rem_data: schemas.ReminderUpdate, db: Session = Depends(db_mod.get_db)):
    reminder = db.query(db_mod.Reminder).filter(db_mod.Reminder.id == rem_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    if rem_data.title is not None:
        reminder.title = rem_data.title
    if rem_data.time is not None:
        reminder.time = rem_data.time
    if rem_data.type is not None:
        reminder.type = rem_data.type
    if rem_data.details is not None:
        reminder.details = rem_data.details
    if rem_data.is_active is not None:
        reminder.is_active = rem_data.is_active
        
    db.commit()
    db.refresh(reminder)
    return reminder

@app.delete("/api/reminders/{rem_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(rem_id: int, db: Session = Depends(db_mod.get_db)):
    reminder = db.query(db_mod.Reminder).filter(db_mod.Reminder.id == rem_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(reminder)
    db.commit()
    return None

# ----------------- EXPENSES ROUTES -----------------
@app.get("/api/expenses", response_model=List[schemas.ExpenseResponse])
def get_expenses(db: Session = Depends(db_mod.get_db)):
    return db.query(db_mod.Expense).order_by(db_mod.Expense.date.desc()).all()

@app.post("/api/expenses", response_model=schemas.ExpenseResponse)
def create_expense(exp_data: schemas.ExpenseCreate, db: Session = Depends(db_mod.get_db)):
    expense = db_mod.Expense(
        title=exp_data.title,
        amount=exp_data.amount,
        category=exp_data.category,
        date=exp_data.date
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@app.delete("/api/expenses/{exp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(exp_id: int, db: Session = Depends(db_mod.get_db)):
    expense = db.query(db_mod.Expense).filter(db_mod.Expense.id == exp_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return None

# ----------------- ANALYTICS ROUTES -----------------
@app.get("/api/expenses/analytics", response_model=schemas.AnalyticsResponse)
def get_expense_analytics(db: Session = Depends(db_mod.get_db)):
    user = db.query(db_mod.User).first()
    if not user:
        budget = 25000.0
    else:
        budget = user.monthly_budget
        
    expenses = db.query(db_mod.Expense).all()
    analysis = ai_service.get_predictive_analytics(expenses, budget)
    return analysis

# ----------------- GOVERNMENT SCHEMES ROUTES -----------------
@app.get("/api/schemes", response_model=List[schemas.GovernmentSchemeResponse])
def get_eligible_schemes(db: Session = Depends(db_mod.get_db)):
    user = db.query(db_mod.User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not configured")
        
    user_dict = {
        "name": user.name,
        "age": user.age,
        "state": user.state,
        "occupation": user.occupation,
        "monthly_budget": user.monthly_budget
    }
    
    schemes = db.query(db_mod.GovernmentScheme).all()
    recommended = ai_service.recommend_government_schemes(user_dict, schemes)
    return recommended

# ----------------- OCR DOCUMENT SCANNER ROUTE -----------------
@app.post("/api/documents/upload")
def upload_document(file: UploadFile = File(...), db: Session = Depends(db_mod.get_db)):
    # Save file locally
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Analyze document using AI Service (OCR/Vision)
    analysis = ai_service.analyze_document_with_vision(file_path, file.filename)
    
    # Store document in database
    db_doc = db_mod.Document(
        filename=file.filename,
        category=analysis.get("category", "other"),
        extracted_text=analysis.get("extracted_text", ""),
        summary=analysis.get("summary", ""),
        file_path=f"/uploads/{safe_filename}",
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    action_taken = ""
    
    # Perform automatic linkages based on category
    if db_doc.category == "bill":
        amount = analysis.get("total_amount", 0.0)
        title = analysis.get("title", f"Scanned Bill ({db_doc.filename})")
        cat = analysis.get("bill_category", "Other")
        # Add to expenses
        expense = db_mod.Expense(
            title=title,
            amount=amount,
            category=cat,
            date=datetime.now().strftime("%Y-%m-%d"),
            doc_id=db_doc.id
        )
        db.add(expense)
        db.commit()
        action_taken = f"Added as an expense under category '{cat}' for Rs. {amount:.2f}."
        
    elif db_doc.category == "prescription":
        meds = analysis.get("medicines", [])
        added_reminders = []
        for m in meds:
            # Create a reminder for this medicine
            rem = db_mod.Reminder(
                title=f"Take {m.get('name')}",
                time=m.get("time", "08:00"),
                type="medicine",
                details=f"Dosage: {m.get('dosage')}. Instructions: {m.get('details')}",
                is_active=True
            )
            db.add(rem)
            added_reminders.append(m.get("name"))
        db.commit()
        if added_reminders:
            action_taken = f"Scheduled medicine reminders for: {', '.join(added_reminders)}."
        else:
            action_taken = "Scanned prescription but no structured medicines were scheduled."
            
    elif db_doc.category == "notice":
        actions = analysis.get("actions_required", [])
        added_tasks = []
        for act in actions:
            # Add to Daily Planner tasks
            task = db_mod.Task(
                title=f"Notice action: {act}",
                due_time="09:00",
                date=datetime.now().strftime("%Y-%m-%d"),
                is_completed=False
            )
            db.add(task)
            added_tasks.append(act)
        db.commit()
        if added_tasks:
            action_taken = f"Created urgent action tasks on your daily planner."
        else:
            action_taken = "Scanned notice for records."
    else:
        action_taken = "Document uploaded and summarized successfully."
        
    return {
        "success": True,
        "document": {
            "id": db_doc.id,
            "filename": db_doc.filename,
            "category": db_doc.category,
            "summary": db_doc.summary,
            "file_path": db_doc.file_path,
        },
        "action_taken": action_taken,
        "savings_recommendation": analysis.get("savings_recommendation", "")
    }

@app.get("/api/documents", response_model=List[schemas.DocumentResponse])
def get_documents(db: Session = Depends(db_mod.get_db)):
    return db.query(db_mod.Document).order_by(db_mod.Document.created_at.desc()).all()

@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(db_mod.get_db)):
    doc = db.query(db_mod.Document).filter(db_mod.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete physical file from disk if it exists
    if doc.file_path:
        filename = doc.file_path.replace("/uploads/", "")
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Error removing file {file_path}: {e}")
                
    db.delete(doc)
    db.commit()
    return {"success": True, "detail": "Document and associated file deleted successfully"}

# ----------------- CHAT ROUTE -----------------
@app.post("/api/chat", response_model=schemas.ChatResponse)
def handle_assistant_chat(chat_req: schemas.ChatRequest, db: Session = Depends(db_mod.get_db)):
    user = db.query(db_mod.User).first()
    if not user:
        user_dict = {"name": "AI Innovator", "monthly_budget": 20000.0}
    else:
        user_dict = {
            "name": user.name,
            "age": user.age,
            "state": user.state,
            "occupation": user.occupation,
            "monthly_budget": user.monthly_budget
        }
        
    # Get current DB context to pass to LLM
    tasks = db.query(db_mod.Task).all()
    reminders = db.query(db_mod.Reminder).all()
    expenses = db.query(db_mod.Expense).all()
    total_spent = sum(e.amount for e in expenses)
    
    db_context = {
        "tasks": [{"title": t.title, "due_time": t.due_time, "is_completed": t.is_completed} for t in tasks],
        "reminders": [{"title": r.title, "time": r.time, "type": r.type, "details": r.details, "is_active": r.is_active} for r in reminders],
        "expenses": [{"title": e.title, "amount": e.amount, "category": e.category, "date": e.date} for e in expenses],
        "total_spent": total_spent
    }
    
    reply = ai_service.chat_assistant(chat_req.message, user_dict, db_context)
    return {"reply": reply}
