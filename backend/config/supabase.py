"""
Configuração do cliente Supabase para o backend
Fornece acesso ao banco de dados PostgreSQL, autenticação e storage
"""

from supabase import create_client, Client
import os
from dotenv import load_dotenv
from typing import Optional

# Carrega as variáveis de ambiente from .env in project root
load_dotenv()

# Configuração do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Clientes Supabase
_supabase_client: Optional[Client] = None
_supabase_admin: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Retorna o cliente Supabase padrão (com chave anônima)
    Usado para operações que respeitam Row Level Security (RLS)
    """
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise ValueError('SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables')
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
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables')
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
