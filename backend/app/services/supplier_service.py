from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from ..models.supplier import Supplier
from ..models.location import Location
from ..schemas.supplier import SupplierCreate, SupplierUpdate, SupplierFilter

class SupplierService:
    def __init__(self, db: Session):
        self.db = db

    def create_supplier(self, supplier_data: SupplierCreate) -> Supplier:
        """Criar novo fornecedor"""
        supplier = Supplier(**supplier_data.model_dump())
        self.db.add(supplier)
        self.db.commit()
        self.db.refresh(supplier)
        return supplier

    def get_supplier(self, supplier_id: int) -> Optional[Supplier]:
        """Buscar fornecedor por ID"""
        return self.db.query(Supplier).filter(Supplier.id == supplier_id).first()

    def get_suppliers(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[SupplierFilter] = None
    ) -> List[Supplier]:
        """Buscar fornecedores com filtros"""
        query = self.db.query(Supplier)

        if filters:
            if filters.name:
                query = query.filter(Supplier.name.ilike(f"%{filters.name}%"))

            if filters.tax_id:
                query = query.filter(Supplier.tax_id.ilike(f"%{filters.tax_id}%"))

            if filters.email:
                query = query.filter(Supplier.email.ilike(f"%{filters.email}%"))

            if filters.is_active is not None:
                query = query.filter(Supplier.is_active == filters.is_active)

            if filters.rating_min is not None:
                query = query.filter(Supplier.rating >= filters.rating_min)

            if filters.rating_max is not None:
                query = query.filter(Supplier.rating <= filters.rating_max)

            if filters.has_locations is not None:
                if filters.has_locations:
                    query = query.filter(Supplier.locations.any())
                else:
                    query = query.filter(~Supplier.locations.any())

        return query.offset(skip).limit(limit).all()

    def get_suppliers_count(self, filters: Optional[SupplierFilter] = None) -> int:
        """Contar fornecedores com filtros"""
        query = self.db.query(Supplier)

        if filters:
            if filters.name:
                query = query.filter(Supplier.name.ilike(f"%{filters.name}%"))

            if filters.tax_id:
                query = query.filter(Supplier.tax_id.ilike(f"%{filters.tax_id}%"))

            if filters.email:
                query = query.filter(Supplier.email.ilike(f"%{filters.email}%"))

            if filters.is_active is not None:
                query = query.filter(Supplier.is_active == filters.is_active)

            if filters.rating_min is not None:
                query = query.filter(Supplier.rating >= filters.rating_min)

            if filters.rating_max is not None:
                query = query.filter(Supplier.rating <= filters.rating_max)

            if filters.has_locations is not None:
                if filters.has_locations:
                    query = query.filter(Supplier.locations.any())
                else:
                    query = query.filter(~Supplier.locations.any())

        return query.count()

    def update_supplier(self, supplier_id: int, supplier_data: SupplierUpdate) -> Optional[Supplier]:
        """Atualizar fornecedor"""
        supplier = self.get_supplier(supplier_id)
        if not supplier:
            return None

        update_data = supplier_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(supplier, field, value)

        self.db.commit()
        self.db.refresh(supplier)
        return supplier

    def delete_supplier(self, supplier_id: int) -> bool:
        """Deletar fornecedor"""
        supplier = self.get_supplier(supplier_id)
        if not supplier:
            return False

        # Verificar se há locações vinculadas
        locations_count = self.db.query(Location).filter(Location.supplier_id == supplier_id).count()
        if locations_count > 0:
            raise ValueError(f"Não é possível deletar o fornecedor. Há {locations_count} locação(ões) vinculada(s).")

        self.db.delete(supplier)
        self.db.commit()
        return True

    def get_supplier_locations(self, supplier_id: int) -> List[Location]:
        """Buscar locações de um fornecedor"""
        return self.db.query(Location).filter(Location.supplier_id == supplier_id).all()

    def get_suppliers_with_location_count(self) -> List[dict]:
        """Buscar fornecedores com contagem de locações"""
        result = self.db.query(
            Supplier,
            func.count(Location.id).label('locations_count')
        ).outerjoin(Location).group_by(Supplier.id).all()

        return [
            {
                'supplier': supplier,
                'locations_count': locations_count
            }
            for supplier, locations_count in result
        ]

    def search_suppliers(self, search_term: str) -> List[Supplier]:
        """Buscar fornecedores por termo de busca"""
        return self.db.query(Supplier).filter(
            or_(
                Supplier.name.ilike(f"%{search_term}%"),
                Supplier.tax_id.ilike(f"%{search_term}%"),
                Supplier.email.ilike(f"%{search_term}%")
            )
        ).all()
