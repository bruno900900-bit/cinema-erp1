from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import os
from dotenv import load_dotenv
from sqlalchemy import text

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do banco de dados PostgreSQL
POSTGRES_USER = os.getenv("POSTGRES_USER", "cinema_erp")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "cinema_erp")

# URL de conexão PostgreSQL
SQLALCHEMY_DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

# Configurações do engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true"
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos
Base = declarative_base()

# Dependency para injeção de dependência
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Função para criar todas as tabelas
def create_tables():
    from ..models import Base
    Base.metadata.create_all(bind=engine)

# Função para criar extensões PostgreSQL
def create_extensions():
    """Cria extensões necessárias no PostgreSQL"""
    with engine.connect() as conn:
        # PostGIS para geolocalização (comentado - não necessário para funcionalidade básica)
        # conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))

        # Trigram para busca fuzzy
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))

        # Unaccent para busca sem acentos
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS unaccent"))

        # UUID para IDs únicos
        conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))

        conn.commit()

# Função para criar índices otimizados
def create_indexes():
    """Cria índices otimizados para performance"""
    with engine.connect() as conn:
        # Índices para busca textual
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_locations_title_gin
            ON locations USING GIN (title gin_trgm_ops)
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_locations_description_gin
            ON locations USING GIN (description gin_trgm_ops)
        """))

        # Índices para filtros comuns
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_locations_status
            ON locations (status)
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_locations_space_type
            ON locations (space_type)
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_locations_city
            ON locations (city)
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_locations_price_day_cinema
            ON locations (price_day_cinema)
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_locations_price_day_publicidade
            ON locations (price_day_publicidade)
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_locations_capacity
            ON locations (capacity)
        """))

        # Índices para relacionamentos
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_locations_project_id
            ON locations (project_id)
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_locations_supplier_id
            ON locations (supplier_id)
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_locations_responsible_user_id
            ON locations (responsible_user_id)
        """))

        # Índices para datas
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_locations_created_at
            ON locations (created_at)
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_locations_updated_at
            ON locations (updated_at)
        """))

        # Índices para tags
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_location_tags_location_id
            ON location_tags (location_id)
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_location_tags_tag_id
            ON location_tags (tag_id)
        """))

        # Índices para fotos
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_location_photos_location_id
            ON location_photos (location_id)
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_location_photos_sort_order
            ON location_photos (sort_order)
        """))

        conn.commit()

# Função para inicialização completa do banco
def initialize_database():
    """Inicializa o banco de dados com todas as configurações"""
    print("🗄️ Inicializando banco de dados PostgreSQL...")

    # Criar extensões
    print("🔧 Criando extensões PostgreSQL...")
    create_extensions()

    # Criar tabelas
    print("🏗️ Criando tabelas...")
    create_tables()

    # Criar índices
    print("📊 Criando índices otimizados...")
    create_indexes()

    print("✅ Banco de dados inicializado com sucesso!")

if __name__ == "__main__":
    initialize_database()
