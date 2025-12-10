from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os

# Configuração do banco de dados: permite sobrescrever via env
# Usar caminho absoluto para garantir que estamos usando o banco correto
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, "cinema_erp.db")
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

# Configurações dinâmicas para compatibilidade com diferentes bancos
engine_kwargs = {"echo": True}

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

if SQLALCHEMY_DATABASE_URL.startswith("sqlite:///:memory:"):
    engine_kwargs["poolclass"] = StaticPool

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
