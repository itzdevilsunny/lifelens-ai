from pydantic import BaseModel
from typing import Optional, List

class UserBase(BaseModel):
    name: str
    age: int
    state: str
    occupation: str
    monthly_budget: float

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    is_completed: bool = False
    due_time: Optional[str] = None
    date: str

class TaskCreate(BaseModel):
    title: str
    due_time: Optional[str] = None
    date: str

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None
    due_time: Optional[str] = None
    date: Optional[str] = None

class TaskResponse(TaskBase):
    id: int

    class Config:
        from_attributes = True

class ReminderBase(BaseModel):
    title: str
    time: str
    type: str
    details: Optional[str] = None
    is_active: bool = True

class ReminderCreate(BaseModel):
    title: str
    time: str
    type: str
    details: Optional[str] = None

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    time: Optional[str] = None
    type: Optional[str] = None
    details: Optional[str] = None
    is_active: Optional[bool] = None

class ReminderResponse(ReminderBase):
    id: int

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    title: str
    amount: float
    category: str
    date: str
    doc_id: Optional[int] = None

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    date: str

class ExpenseResponse(ExpenseBase):
    id: int

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: int
    filename: str
    category: str
    extracted_text: Optional[str]
    summary: Optional[str]
    file_path: str
    created_at: str

    class Config:
        from_attributes = True

class GovernmentSchemeResponse(BaseModel):
    id: int
    title: str
    description: str
    eligibility: str
    benefit: str
    state: str

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

class AnalyticsResponse(BaseModel):
    total_spent: float
    monthly_budget: float
    predicted_spending: float
    overage_warning: bool
    overage_amount: float
    recommendations: List[str]
