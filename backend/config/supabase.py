"""
Configuração do cliente Supabase para o backend
Fornece acesso ao banco de dados PostgreSQL, autenticação e storage
"""

from supabase import create_client, Client
import os
from dotenv import load_dotenv
from typing import Optional

# Carrega as variáveis de ambiente
load_dotenv()

# Configuração do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://rwpmtuohcvnciemtsjge.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTM1NzYsImV4cCI6MjA4MDg4OTU3Nn0.Wpkkzef7vTKQGQ5CZX41-qXHoQu4r_r67lK-fmvWQV8")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMxMzU3NiwiZXhwIjoyMDgwODg5NTc2fQ.d1c1WPyOtRBkJ1E3DwYUtoQ7FUJ0iSGA14dokqx_8ww")

# Clientes Supabase
_supabase_client: Optional[Client] = None
_supabase_admin: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Retorna o cliente Supabase padrão (com chave anônima)
    Usado para operações que respeitam Row Level Security (RLS)
    """
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    return _supabase_client


def get_supabase_admin() -> Client:
    """
    Retorna o cliente Supabase admin (com service role key)
    Usado para operações administrativas que ignoram RLS
    Use com cuidado!
    """
    global _supabase_admin
    if _supabase_admin is None:
        _supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_admin


# Aliases para compatibilidade
def get_client() -> Client:
    """Alias para get_supabase_client()"""
    return get_supabase_client()


def get_admin_client() -> Client:
    """Alias para get_supabase_admin()"""
    return get_supabase_admin()


# Exporta as instâncias
supabase = get_supabase_client()
supabase_admin = get_supabase_admin()
