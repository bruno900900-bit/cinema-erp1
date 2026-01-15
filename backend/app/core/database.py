from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool, QueuePool
import os

# Carregar variáveis de ambiente do .env se disponível
from dotenv import load_dotenv
load_dotenv()

# Configuração do banco de dados: permite sobrescrever via env
# Usar caminho absoluto para garantir que estamos usando o banco correto
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, "cinema_erp.db")
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

print(f"[DATABASE] URL configurada: {SQLALCHEMY_DATABASE_URL[:50]}...")

# Configurações dinâmicas para compatibilidade com diferentes bancos
engine_kwargs = {"echo": True}

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # Configurações específicas para SQLite
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite:///:memory:"):
        engine_kwargs["poolclass"] = StaticPool
elif SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # Configurações específicas para PostgreSQL (Supabase)
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_timeout"] = 30
    engine_kwargs["pool_recycle"] = 1800
    engine_kwargs["pool_pre_ping"] = True
    # Supabase requer SSL
    engine_kwargs["connect_args"] = {"sslmode": "require"}
    print("[DATABASE] Configurado para PostgreSQL com SSL")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    **engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos
from ..models.base import Base

# Dependency para injeção de dependência
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Função para criar todas as tabelas
def create_tables():
    # Importar todos os modelos para garantir que sejam registrados no metadata
    from ..models import (
        User, Project, Location, Supplier, ProjectTask,
        ProjectStage, Contract, Visit, FinancialMovement
    )
    Base.metadata.create_all(bind=engine)
