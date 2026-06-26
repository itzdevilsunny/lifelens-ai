import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

# Single shared Supabase client for the entire backend
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def init_db():
    """No-op: Tables are pre-created via SQL migration in Supabase dashboard."""
    pass


def get_supabase() -> Client:
    """Dependency injector — yields the shared Supabase client."""
    return supabase
