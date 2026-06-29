import os
import shutil
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from supabase import Client
from typing import List, Optional

import database as db_mod
import schemas
import ai_service

# Initialize FastAPI App
app = FastAPI(title="LifePilot AI API", version="2.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory for document uploads (files still stored locally)
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount uploads static files so frontend can display uploaded receipts
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def startup_event():
    db_mod.init_db()
    try:
        from seed import seed_data
        seed_data()
    except Exception as e:
        print(f"⚠️  Seed skipped (Supabase tables may not exist yet): {e}")
        print("   Run backend/supabase_migration.sql in Supabase SQL Editor first.")


# ─── Helper ──────────────────────────────────────────────────────────────────

def get_db() -> Client:
    return db_mod.get_supabase()


# ─── USER PROFILE ROUTES ─────────────────────────────────────────────────────

@app.get("/api/user", response_model=schemas.UserResponse)
def get_user_profile(db: Client = Depends(get_db)):
    res = db.table("users").select("*").limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
    return res.data[0]


@app.put("/api/user", response_model=schemas.UserResponse)
def update_user_profile(user_data: schemas.UserCreate, db: Client = Depends(get_db)):
    existing = db.table("users").select("id").limit(1).execute()
    payload = {
        "name": user_data.name,
        "age": user_data.age,
        "state": user_data.state,
        "occupation": user_data.occupation,
        "monthly_budget": user_data.monthly_budget,
    }
    if existing.data:
        user_id = existing.data[0]["id"]
        res = db.table("users").update(payload).eq("id", user_id).execute()
    else:
        res = db.table("users").insert(payload).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to save user profile")
    return res.data[0]


# ─── DAILY PLANNER (TASKS) ROUTES ────────────────────────────────────────────

@app.get("/api/tasks", response_model=List[schemas.TaskResponse])
def get_tasks(date: Optional[str] = None, db: Client = Depends(get_db)):
    query = db.table("tasks").select("*")
    if date:
        query = query.eq("date", date)
    res = query.order("due_time", desc=False).execute()
    return res.data or []


@app.post("/api/tasks", response_model=schemas.TaskResponse)
def create_task(task_data: schemas.TaskCreate, db: Client = Depends(get_db)):
    payload = {
        "title": task_data.title,
        "due_time": task_data.due_time,
        "date": task_data.date,
        "is_completed": False,
    }
    res = db.table("tasks").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create task")
    return res.data[0]


@app.put("/api/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task_data: schemas.TaskUpdate, db: Client = Depends(get_db)):
    existing = db.table("tasks").select("*").eq("id", task_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Task not found")

    payload = {}
    if task_data.title is not None:
        payload["title"] = task_data.title
    if task_data.is_completed is not None:
        payload["is_completed"] = task_data.is_completed
    if task_data.due_time is not None:
        payload["due_time"] = task_data.due_time
    if task_data.date is not None:
        payload["date"] = task_data.date

    res = db.table("tasks").update(payload).eq("id", task_id).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to update task")
    return res.data[0]


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Client = Depends(get_db)):
    existing = db.table("tasks").select("id").eq("id", task_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Task not found")
    db.table("tasks").delete().eq("id", task_id).execute()
    return None


# ─── SMART REMINDERS ROUTES ──────────────────────────────────────────────────

@app.get("/api/reminders", response_model=List[schemas.ReminderResponse])
def get_reminders(type: Optional[str] = None, db: Client = Depends(get_db)):
    query = db.table("reminders").select("*")
    if type:
        query = query.eq("type", type)
    res = query.order("time", desc=False).execute()
    return res.data or []


@app.post("/api/reminders", response_model=schemas.ReminderResponse)
def create_reminder(rem_data: schemas.ReminderCreate, db: Client = Depends(get_db)):
    payload = {
        "title": rem_data.title,
        "time": rem_data.time,
        "type": rem_data.type,
        "details": rem_data.details,
        "is_active": True,
    }
    res = db.table("reminders").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create reminder")
    return res.data[0]


@app.put("/api/reminders/{rem_id}", response_model=schemas.ReminderResponse)
def update_reminder(rem_id: int, rem_data: schemas.ReminderUpdate, db: Client = Depends(get_db)):
    existing = db.table("reminders").select("*").eq("id", rem_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Reminder not found")

    payload = {}
    if rem_data.title is not None:
        payload["title"] = rem_data.title
    if rem_data.time is not None:
        payload["time"] = rem_data.time
    if rem_data.type is not None:
        payload["type"] = rem_data.type
    if rem_data.details is not None:
        payload["details"] = rem_data.details
    if rem_data.is_active is not None:
        payload["is_active"] = rem_data.is_active

    res = db.table("reminders").update(payload).eq("id", rem_id).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to update reminder")
    return res.data[0]


@app.delete("/api/reminders/{rem_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(rem_id: int, db: Client = Depends(get_db)):
    existing = db.table("reminders").select("id").eq("id", rem_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.table("reminders").delete().eq("id", rem_id).execute()
    return None


# ─── EXPENSES ROUTES ─────────────────────────────────────────────────────────

@app.get("/api/expenses", response_model=List[schemas.ExpenseResponse])
def get_expenses(db: Client = Depends(get_db)):
    res = db.table("expenses").select("*").order("date", desc=True).execute()
    return res.data or []


@app.post("/api/expenses", response_model=schemas.ExpenseResponse)
def create_expense(exp_data: schemas.ExpenseCreate, db: Client = Depends(get_db)):
    payload = {
        "title": exp_data.title,
        "amount": exp_data.amount,
        "category": exp_data.category,
        "date": exp_data.date,
    }
    res = db.table("expenses").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create expense")
    return res.data[0]


@app.delete("/api/expenses/{exp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(exp_id: int, db: Client = Depends(get_db)):
    existing = db.table("expenses").select("id").eq("id", exp_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.table("expenses").delete().eq("id", exp_id).execute()
    return None


# ─── ANALYTICS ROUTES ────────────────────────────────────────────────────────

@app.get("/api/expenses/analytics", response_model=schemas.AnalyticsResponse)
def get_expense_analytics(db: Client = Depends(get_db)):
    user_res = db.table("users").select("monthly_budget").limit(1).execute()
    budget = user_res.data[0]["monthly_budget"] if user_res.data else 25000.0

    expenses_res = db.table("expenses").select("*").execute()
    expenses = expenses_res.data or []

    # Build minimal expense objects for ai_service compatibility
    class _Expense:
        def __init__(self, d):
            self.amount = d["amount"]
            self.category = d["category"]
            self.title = d["title"]
            self.date = d["date"]

    expense_objs = [_Expense(e) for e in expenses]
    analysis = ai_service.get_predictive_analytics(expense_objs, budget)
    return analysis


# ─── GOVERNMENT SCHEMES ROUTES ───────────────────────────────────────────────

@app.get("/api/schemes", response_model=List[schemas.GovernmentSchemeResponse])
def get_eligible_schemes(db: Client = Depends(get_db)):
    user_res = db.table("users").select("*").limit(1).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User profile not configured")

    user = user_res.data[0]
    user_dict = {
        "name": user["name"],
        "age": user["age"],
        "state": user["state"],
        "occupation": user["occupation"],
        "monthly_budget": user["monthly_budget"],
    }

    schemes_res = db.table("government_schemes").select("*").execute()
    schemes = schemes_res.data or []

    class _Scheme:
        def __init__(self, d):
            self.id = d["id"]
            self.title = d["title"]
            self.description = d["description"]
            self.eligibility = d["eligibility"]
            self.benefit = d["benefit"]
            self.state = d["state"]

    scheme_objs = [_Scheme(s) for s in schemes]
    recommended = ai_service.recommend_government_schemes(user_dict, scheme_objs)
    return recommended


# ─── OCR DOCUMENT SCANNER ROUTE ──────────────────────────────────────────────

@app.post("/api/documents/upload")
def upload_document(file: UploadFile = File(...), db: Client = Depends(get_db)):
    # Save file locally
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Analyze document using AI
    analysis = ai_service.analyze_document_with_vision(file_path, file.filename)

    # Combine summary and savings recommendation to make it persist in the DB
    full_summary = db_summary = analysis.get("summary", "")
    if analysis.get("savings_recommendation"):
        db_summary = f"{full_summary}\n\n💡 Optimization Tip: {analysis['savings_recommendation']}"

    # Store document record in Supabase
    doc_payload = {
        "filename": file.filename,
        "category": analysis.get("category", "other"),
        "extracted_text": analysis.get("extracted_text", ""),
        "summary": db_summary,
        "file_path": f"/uploads/{safe_filename}",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    doc_res = db.table("documents").insert(doc_payload).execute()
    if not doc_res.data:
        raise HTTPException(status_code=500, detail="Failed to save document record")
    db_doc = doc_res.data[0]

    action_taken = ""

    if db_doc["category"] == "bill":
        amount = analysis.get("total_amount", 0.0)
        title = analysis.get("title", f"Scanned Bill ({db_doc['filename']})")
        cat = analysis.get("bill_category", "Other")
        db.table("expenses").insert({
            "title": title,
            "amount": amount,
            "category": cat,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "doc_id": db_doc["id"],
        }).execute()
        action_taken = f"Added as an expense under category '{cat}' for Rs. {amount:.2f}."

    elif db_doc["category"] == "prescription":
        meds = analysis.get("medicines", [])
        added_reminders = []
        for m in meds:
            db.table("reminders").insert({
                "title": f"Take {m.get('name')}",
                "time": m.get("time", "08:00"),
                "type": "medicine",
                "details": f"Dosage: {m.get('dosage')}. Instructions: {m.get('details')}",
                "is_active": True,
            }).execute()
            added_reminders.append(m.get("name"))
        action_taken = (
            f"Scheduled medicine reminders for: {', '.join(added_reminders)}."
            if added_reminders
            else "Scanned prescription but no structured medicines were scheduled."
        )

    elif db_doc["category"] == "notice":
        actions = analysis.get("actions_required", [])
        for act in actions:
            db.table("tasks").insert({
                "title": f"Notice action: {act}",
                "due_time": "09:00",
                "date": datetime.now().strftime("%Y-%m-%d"),
                "is_completed": False,
            }).execute()
        action_taken = (
            "Created urgent action tasks on your daily planner."
            if actions
            else "Scanned notice for records."
        )
    else:
        action_taken = "Document uploaded and summarized successfully."

    return {
        "success": True,
        "document": {
            "id": db_doc["id"],
            "filename": db_doc["filename"],
            "category": db_doc["category"],
            "summary": db_doc["summary"],
            "file_path": db_doc["file_path"],
        },
        "action_taken": action_taken,
        "savings_recommendation": analysis.get("savings_recommendation", ""),
    }


@app.get("/api/documents", response_model=List[schemas.DocumentResponse])
def get_documents(db: Client = Depends(get_db)):
    res = db.table("documents").select("*").order("created_at", desc=True).execute()
    return res.data or []


@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int, db: Client = Depends(get_db)):
    doc_res = db.table("documents").select("*").eq("id", doc_id).execute()
    if not doc_res.data:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = doc_res.data[0]
    if doc.get("file_path"):
        filename = doc["file_path"].replace("/uploads/", "")
        local_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except Exception as e:
                print(f"Error removing file {local_path}: {e}")

    db.table("documents").delete().eq("id", doc_id).execute()
    return {"success": True, "detail": "Document and associated file deleted successfully"}


# ─── CHAT ROUTE ──────────────────────────────────────────────────────────────

@app.post("/api/chat", response_model=schemas.ChatResponse)
def handle_assistant_chat(chat_req: schemas.ChatRequest, db: Client = Depends(get_db)):
    user_res = db.table("users").select("*").limit(1).execute()
    user_dict = (
        {
            "name": user_res.data[0]["name"],
            "age": user_res.data[0]["age"],
            "state": user_res.data[0]["state"],
            "occupation": user_res.data[0]["occupation"],
            "monthly_budget": user_res.data[0]["monthly_budget"],
        }
        if user_res.data
        else {"name": "AI Innovator", "monthly_budget": 20000.0}
    )

    tasks = db.table("tasks").select("title,due_time,is_completed").execute().data or []
    reminders = db.table("reminders").select("title,time,type,details,is_active").execute().data or []
    expenses = db.table("expenses").select("title,amount,category,date").execute().data or []
    total_spent = sum(e["amount"] for e in expenses)

    db_context = {
        "tasks": tasks,
        "reminders": reminders,
        "expenses": expenses,
        "total_spent": total_spent,
    }

    reply = ai_service.chat_assistant(chat_req.message, user_dict, db_context)
    return {"reply": reply}
