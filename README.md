# LifeLens AI 🇮🇳

> **Your Everyday Personal AI Assistant** — A full-stack AI-powered life management platform built for everyday Indians.

![LifeLens AI Dashboard](./frontend/public/vite.svg)

---

## ✨ Features

| Module | Description |
|---|---|
| 📅 **Daily Planner** | Add, complete, and delete tasks with time tracking |
| 🔔 **Smart Reminders** | Medicine doses & bill payment alerts with on/off toggles |
| 🧾 **OCR Document Scanner** | Gemini Vision-powered receipt/bill scanning with a Document Vault |
| 💸 **Expense Tracker** | Expense ledger with AI-driven budget analytics & overspend warnings |
| 🏛️ **Gov Scheme Finder** | State-wise government scheme eligibility matcher |
| 🎙️ **Voice / Chat Assistant** | Talk or type to your Gemini-powered AI assistant |
| 👤 **Profile Editor** | Edit name, age, state, occupation, and monthly budget — updates propagate everywhere |

---

## 🏗️ Tech Stack

**Backend**
- Python 3.11 + FastAPI
- SQLAlchemy (SQLite)
- Google Gemini 1.5 Flash (via `google-generativeai`)

**Frontend**
- React 18 + TypeScript
- Vite
- TailwindCSS
- Axios + Lucide React

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/itzdevilsunny/lifelens-ai.git
cd lifelens-ai
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Set your Gemini API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

The API will be live at **http://localhost:8000**  
Swagger docs at **http://localhost:8000/docs**

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be live at **http://localhost:5173**

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Your Google Gemini API key from [AI Studio](https://aistudio.google.com/app/apikey) |

---

## 📁 Project Structure

```
lifelens-ai/
├── backend/
│   ├── main.py          # FastAPI app & all API routes
│   ├── database.py      # SQLAlchemy models & DB init
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── ai_service.py    # Gemini AI integration
│   ├── seed.py          # Sample data seeder
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx      # Main app, state management, API calls
│   │   └── components/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── ProfileModal.tsx
│   │       ├── DailyPlanner.tsx
│   │       ├── SmartReminders.tsx
│   │       ├── DocumentScanner.tsx
│   │       ├── ExpenseTracker.tsx
│   │       ├── SchemeFinder.tsx
│   │       └── VoiceAssistant.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 📜 License

MIT — free to use, modify, and distribute.
