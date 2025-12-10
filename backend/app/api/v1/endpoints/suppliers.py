from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ....core.database import get_db
from ....models.user import User
from ....schemas.supplier import (
    SupplierCreate,
    SupplierUpdate,
    SupplierResponse,
    SupplierListResponse,
    SupplierFilter
)
from ....services.supplier_service import SupplierService
from ....core.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=SupplierResponse)
def create_supplier(
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar novo fornecedor"""
    service = SupplierService(db)
    return service.create_supplier(supplier_data)

@router.get("/", response_model=SupplierListResponse)
def get_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    name: Optional[str] = Query(None),
    tax_id: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    rating_min: Optional[float] = Query(None, ge=1.0, le=5.0),
    rating_max: Optional[float] = Query(None, ge=1.0, le=5.0),
    has_locations: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """Buscar fornecedores com filtros"""
    service = SupplierService(db)

    filters = SupplierFilter(
        name=name,
        tax_id=tax_id,
        email=email,
        is_active=is_active,
        rating_min=rating_min,
        rating_max=rating_max,
        has_locations=has_locations
    )

    suppliers = service.get_suppliers(skip=skip, limit=limit, filters=filters)
    total = service.get_suppliers_count(filters=filters)

    # Adicionar contagem de locações para cada fornecedor
    suppliers_with_count = []
    for supplier in suppliers:
        supplier_dict = supplier.__dict__.copy()
        supplier_dict['locations_count'] = len(supplier.locations)
        suppliers_with_count.append(supplier_dict)

    return SupplierListResponse(
        suppliers=suppliers_with_count,
        total=total,
        page=skip // limit + 1,
        size=limit,
        total_pages=(total + limit - 1) // limit
    )

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # Temporariamente desabilitado para teste
):
    """Buscar fornecedor por ID"""
    service = SupplierService(db)
    supplier = service.get_supplier(supplier_id)

    if not supplier:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

    # Adicionar contagem de locações
    supplier_dict = supplier.__dict__.copy()
    supplier_dict['locations_count'] = len(supplier.locations)

    return supplier_dict

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    supplier_data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar fornecedor"""
    service = SupplierService(db)
    supplier = service.update_supplier(supplier_id, supplier_data)

    if not supplier:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

    # Adicionar contagem de locações
    supplier_dict = supplier.__dict__.copy()
    supplier_dict['locations_count'] = len(supplier.locations)

    return supplier_dict

@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar fornecedor"""
    service = SupplierService(db)

    try:
        success = service.delete_supplier(supplier_id)
        if not success:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

        return {"message": "Fornecedor deletado com sucesso"}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{supplier_id}/locations")
def get_supplier_locations(
    supplier_id: int,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # Temporariamente desabilitado para teste
):
    """Buscar locações de um fornecedor"""
    service = SupplierService(db)
    supplier = service.get_supplier(supplier_id)

    if not supplier:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

    locations = service.get_supplier_locations(supplier_id)
    return {"supplier_id": supplier_id, "locations": locations}

@router.get("/search/{search_term}")
def search_suppliers(
    search_term: str,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # Temporariamente desabilitado para teste
):
    """Buscar fornecedores por termo de busca"""
    service = SupplierService(db)
    suppliers = service.search_suppliers(search_term)

    # Adicionar contagem de locações para cada fornecedor
    suppliers_with_count = []
    for supplier in suppliers:
        supplier_dict = supplier.__dict__.copy()
        supplier_dict['locations_count'] = len(supplier.locations)
        suppliers_with_count.append(supplier_dict)

    return {"search_term": search_term, "suppliers": suppliers_with_count}
