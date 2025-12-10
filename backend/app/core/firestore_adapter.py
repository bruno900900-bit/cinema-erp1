"""
Adaptador Firestore para substituir SQLite como banco principal
"""
from typing import Dict, List, Optional, Any, Union
import uuid
from datetime import datetime, timezone
import json
from google.cloud.firestore import Client
from google.cloud import firestore
from ..core.firebase_config import get_firestore


class FirestoreAdapter:
    """Adaptador para usar Firestore como banco principal"""

    def __init__(self):
        self.db = get_firestore()

    async def create_document(self, collection: str, data: Dict[str, Any], doc_id: Optional[str] = None) -> str:
        """Criar um novo documento"""
        try:
            # Preparar dados
            document_data = self._prepare_document_data(data)

            # Gerar ID se não fornecido
            if doc_id is None:
                doc_id = str(uuid.uuid4())

            # Criar documento
            doc_ref = self.db.collection(collection).document(doc_id)
            doc_ref.set(document_data)

            return doc_id

        except Exception as e:
            raise Exception(f"Erro ao criar documento em {collection}: {str(e)}")

    async def get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """Obter um documento por ID"""
        try:
            doc_ref = self.db.collection(collection).document(doc_id)
            doc = doc_ref.get()

            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return self._process_document_data(data)

            return None

        except Exception as e:
            raise Exception(f"Erro ao obter documento {doc_id} de {collection}: {str(e)}")

    async def update_document(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        """Atualizar um documento"""
        try:
            document_data = self._prepare_document_data(data)
            document_data['updated_at'] = datetime.now(timezone.utc)

            doc_ref = self.db.collection(collection).document(doc_id)
            doc_ref.update(document_data)

            return True

        except Exception as e:
            raise Exception(f"Erro ao atualizar documento {doc_id} em {collection}: {str(e)}")

    async def delete_document(self, collection: str, doc_id: str) -> bool:
        """Deletar um documento"""
        try:
            doc_ref = self.db.collection(collection).document(doc_id)
            doc_ref.delete()

            return True

        except Exception as e:
            raise Exception(f"Erro ao deletar documento {doc_id} de {collection}: {str(e)}")

    async def list_documents(
        self,
        collection: str,
        filters: Optional[List[tuple]] = None,
        order_by: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Listar documentos com filtros opcionais"""
        try:
            query = self.db.collection(collection)

            # Aplicar filtros
            if filters:
                for field, operator, value in filters:
                    query = query.where(field, operator, value)

            # Aplicar ordenação
            if order_by:
                if order_by.startswith('-'):
                    query = query.order_by(order_by[1:], direction=firestore.Query.DESCENDING)
                else:
                    query = query.order_by(order_by)

            # Aplicar paginação
            if offset:
                query = query.offset(offset)

            if limit:
                query = query.limit(limit)

            # Executar query
            docs = query.stream()

            results = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                results.append(self._process_document_data(data))

            return results

        except Exception as e:
            raise Exception(f"Erro ao listar documentos de {collection}: {str(e)}")

    async def count_documents(self, collection: str, filters: Optional[List[tuple]] = None) -> int:
        """Contar documentos"""
        try:
            query = self.db.collection(collection)

            # Aplicar filtros
            if filters:
                for field, operator, value in filters:
                    query = query.where(field, operator, value)

            # Contar usando agregação
            aggregate_query = firestore.aggregation.AggregationQuery(query)
            aggregate_query.count()

            results = aggregate_query.get()
            return results[0][0].value

        except Exception as e:
            # Fallback: contar manualmente
            docs = await self.list_documents(collection, filters)
            return len(docs)

    async def search_documents(
        self,
        collection: str,
        search_text: str,
        search_fields: List[str]
    ) -> List[Dict[str, Any]]:
        """Buscar documentos por texto"""
        try:
            # Firestore não tem busca full-text nativa
            # Implementação básica usando filtros
            all_docs = await self.list_documents(collection)

            results = []
            search_lower = search_text.lower()

            for doc in all_docs:
                for field in search_fields:
                    if field in doc and doc[field]:
                        field_value = str(doc[field]).lower()
                        if search_lower in field_value:
                            results.append(doc)
                            break

            return results

        except Exception as e:
            raise Exception(f"Erro ao buscar em {collection}: {str(e)}")

    async def batch_create(self, collection: str, documents: List[Dict[str, Any]]) -> List[str]:
        """Criar múltiplos documentos em lote"""
        try:
            batch = self.db.batch()
            doc_ids = []

            for data in documents:
                doc_id = str(uuid.uuid4())
                doc_ref = self.db.collection(collection).document(doc_id)
                document_data = self._prepare_document_data(data)
                batch.set(doc_ref, document_data)
                doc_ids.append(doc_id)

            batch.commit()
            return doc_ids

        except Exception as e:
            raise Exception(f"Erro ao criar documentos em lote em {collection}: {str(e)}")

    async def batch_update(self, collection: str, updates: List[tuple]) -> bool:
        """Atualizar múltiplos documentos em lote"""
        try:
            batch = self.db.batch()

            for doc_id, data in updates:
                doc_ref = self.db.collection(collection).document(doc_id)
                document_data = self._prepare_document_data(data)
                document_data['updated_at'] = datetime.now(timezone.utc)
                batch.update(doc_ref, document_data)

            batch.commit()
            return True

        except Exception as e:
            raise Exception(f"Erro ao atualizar documentos em lote em {collection}: {str(e)}")

    # Métodos específicos para coleções principais

    async def create_user(self, user_data: Dict[str, Any]) -> str:
        """Criar usuário"""
        user_data['role'] = user_data.get('role', 'USER')
        user_data['is_active'] = user_data.get('is_active', True)
        return await self.create_document('users', user_data)

    async def create_project(self, project_data: Dict[str, Any]) -> str:
        """Criar projeto"""
        project_data['status'] = project_data.get('status', 'PLANNING')
        project_data['budget_spent'] = 0.0
        return await self.create_document('projects', project_data)

    async def create_location(self, location_data: Dict[str, Any]) -> str:
        """Criar locação"""
        location_data['status'] = location_data.get('status', 'DRAFT')
        return await self.create_document('locations', location_data)

    async def create_supplier(self, supplier_data: Dict[str, Any]) -> str:
        """Criar fornecedor"""
        supplier_data['is_active'] = supplier_data.get('is_active', True)
        return await self.create_document('suppliers', supplier_data)

    # Métodos para subcoleções

    async def add_to_subcollection(
        self,
        parent_collection: str,
        parent_id: str,
        subcollection: str,
        data: Dict[str, Any],
        doc_id: Optional[str] = None
    ) -> str:
        """Adicionar documento a subcoleção"""
        try:
            document_data = self._prepare_document_data(data)

            if doc_id is None:
                doc_id = str(uuid.uuid4())

            doc_ref = (self.db.collection(parent_collection)
                      .document(parent_id)
                      .collection(subcollection)
                      .document(doc_id))

            doc_ref.set(document_data)
            return doc_id

        except Exception as e:
            raise Exception(f"Erro ao adicionar à subcoleção {subcollection}: {str(e)}")

    async def get_subcollection(
        self,
        parent_collection: str,
        parent_id: str,
        subcollection: str
    ) -> List[Dict[str, Any]]:
        """Obter documentos de subcoleção"""
        try:
            docs = (self.db.collection(parent_collection)
                   .document(parent_id)
                   .collection(subcollection)
                   .stream())

            results = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                results.append(self._process_document_data(data))

            return results

        except Exception as e:
            raise Exception(f"Erro ao obter subcoleção {subcollection}: {str(e)}")

    # Métodos utilitários

    def _prepare_document_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Preparar dados para salvamento no Firestore"""
        document_data = data.copy()

        # Adicionar timestamps se não existirem
        now = datetime.now(timezone.utc)
        if 'created_at' not in document_data:
            document_data['created_at'] = now
        document_data['updated_at'] = now

        # Converter tipos incompatíveis
        for key, value in document_data.items():
            if isinstance(value, dict) and value:
                document_data[key] = value
            elif isinstance(value, list):
                document_data[key] = value
            elif value is None:
                document_data[key] = None
            else:
                document_data[key] = value

        return document_data

    def _process_document_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Processar dados vindos do Firestore"""
        # Converter timestamps para strings ISO se necessário
        for key, value in data.items():
            if hasattr(value, 'timestamp'):
                data[key] = value.isoformat()

        return data

    # Método para compatibilidade com o código existente
    async def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """Executar query personalizada (para compatibilidade)"""
        # Esta é uma implementação básica para compatibilidade
        # Queries SQL complexas precisariam ser reescritas para Firestore
        raise NotImplementedError("Queries SQL não são suportadas no Firestore. Use os métodos específicos.")


# Instância global do adaptador
firestore_adapter = FirestoreAdapter()
