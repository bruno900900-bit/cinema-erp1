"""
Adaptador de banco de dados que permite alternar entre Firebase e SQLAlchemy
Agora com prioridade para Firebase como banco principal
"""
import os
from typing import Any, Dict, List, Optional, Union
from dotenv import load_dotenv
import asyncio

# Carregar variáveis de ambiente
load_dotenv()

# Determinar qual banco usar - SQLite como padrão para facilitar o desenvolvimento local
DATABASE_TYPE = os.getenv("DATABASE_TYPE", "sqlite").lower()

if DATABASE_TYPE == "firestore" or DATABASE_TYPE == "firebase":
    from .firestore_adapter import firestore_adapter
    from .firebase_config import is_firebase_available

    class DatabaseAdapter:
        """Adaptador para Firebase Firestore (novo)"""

        def __init__(self):
            self.db = firestore_adapter

        def is_available(self) -> bool:
            return is_firebase_available()

        async def create_document(self, collection: str, data: Dict[str, Any], doc_id: Optional[str] = None) -> str:
            return await self.db.create_document(collection, data, doc_id)

        async def get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
            return await self.db.get_document(collection, doc_id)

        async def update_document(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
            return await self.db.update_document(collection, doc_id, data)

        async def delete_document(self, collection: str, doc_id: str) -> bool:
            return await self.db.delete_document(collection, doc_id)

        async def get_collection(self, collection: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
            return await self.db.list_documents(collection, limit=limit)

        async def query_documents(self, collection: str, filters: List[tuple] = None,
                                order_by: Optional[str] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
            return await self.db.list_documents(collection, filters, order_by, limit)

        async def count_documents(self, collection: str, filters: List[tuple] = None) -> int:
            return await self.db.count_documents(collection, filters)

        async def search_documents(self, collection: str, search_text: str, search_fields: List[str]) -> List[Dict[str, Any]]:
            return await self.db.search_documents(collection, search_text, search_fields)

        async def batch_create(self, collection: str, documents: List[Dict[str, Any]]) -> List[str]:
            results = []
            for doc in documents:
                doc_id = await self.create_document(collection, doc)
                results.append(doc_id)
            return results

        async def batch_update(self, collection: str, updates: List[Dict[str, Any]]) -> bool:
            for update_item in updates:
                doc_id = update_item.get('id')
                data = update_item.get('data', {})
                if doc_id:
                    await self.update_document(collection, doc_id, data)
            return True

elif DATABASE_TYPE == "sqlite":
    from .database import SessionLocal, Base
    from sqlalchemy.orm import Session
    from sqlalchemy import text

    class DatabaseAdapter:
        """Adaptador para SQLAlchemy (SQLite/PostgreSQL)"""

        def __init__(self):
            self.SessionLocal = SessionLocal
            self.Base = Base

        def is_available(self) -> bool:
            return True

        def get_db_session(self) -> Session:
            return self.SessionLocal()

        async def create_document(self, collection: str, data: Dict[str, Any], doc_id: Optional[str] = None) -> str:
            # Para SQLAlchemy, precisamos mapear collection para modelo
            # Por enquanto, retornamos um ID simulado
            import uuid
            return str(uuid.uuid4())

        async def get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
            # Implementação específica para cada modelo
            return None

        async def update_document(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
            # Implementação específica para cada modelo
            return True

        async def delete_document(self, collection: str, doc_id: str) -> bool:
            # Implementação específica para cada modelo
            return True

        async def get_collection(self, collection: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
            # Implementação específica para cada modelo
            return []

        async def query_documents(self, collection: str, filters: List[Dict[str, Any]] = None,
                                order_by: Optional[str] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
            # Implementação específica para cada modelo
            return []

        async def count_documents(self, collection: str, filters: List[Dict[str, Any]] = None) -> int:
            # Implementação específica para cada modelo
            return 0

        async def batch_create(self, collection: str, documents: List[Dict[str, Any]]) -> List[str]:
            # Implementação específica para cada modelo
            return []

        async def batch_update(self, collection: str, updates: List[Dict[str, Any]]) -> bool:
            # Implementação específica para cada modelo
            return True

else:
    raise ValueError(f"Tipo de banco de dados não suportado: {DATABASE_TYPE}")

# Instância global do adaptador
db_adapter = DatabaseAdapter()

# Função para obter o adaptador
def get_database_adapter():
    """Retorna a instância do adaptador de banco de dados"""
    return db_adapter

# Função para verificar se o banco está disponível
def is_database_available():
    """Verifica se o banco de dados está disponível"""
    return db_adapter.is_available()

# Função para obter informações do banco
def get_database_info():
    """Retorna informações sobre o banco de dados configurado"""
    return {
        "type": DATABASE_TYPE,
        "available": is_database_available(),
        "firebase_project": os.getenv("FIREBASE_PROJECT_ID") if DATABASE_TYPE == "firebase" else None,
        "sqlite_path": os.getenv("DATABASE_URL") if DATABASE_TYPE == "sqlite" else None
    }
