-- LifeLens AI — Supabase SQL Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run

-- 1. Users table
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Aarav Sharma',
  age INTEGER NOT NULL DEFAULT 32,
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  occupation TEXT NOT NULL DEFAULT 'Small Business Owner',
  monthly_budget FLOAT NOT NULL DEFAULT 30000.0
);

-- 2. Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_time TEXT,
  date TEXT NOT NULL
);

-- 3. Reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  time TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  details TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 4. Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  extracted_text TEXT,
  summary TEXT,
  file_path TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 5. Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  amount FLOAT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  date TEXT NOT NULL,
  doc_id BIGINT REFERENCES public.documents(id) ON DELETE SET NULL
);

-- 6. Government Schemes table
CREATE TABLE IF NOT EXISTS public.government_schemes (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  eligibility TEXT NOT NULL,
  benefit TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'All'
);

-- Disable Row Level Security so the backend can access all rows
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_schemes DISABLE ROW LEVEL SECURITY;
