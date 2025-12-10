from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ....core.database import get_db
from ....models.user import User
from ....schemas.custom_filter import (
    CustomFilterCreate,
    CustomFilterUpdate,
    CustomFilterResponse,
    CustomFilterList
)
from ....services.custom_filter_service import CustomFilterService
from ....core.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=CustomFilterResponse, status_code=status.HTTP_201_CREATED)
def create_custom_filter(
    filter_data: CustomFilterCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cria um novo filtro personalizado"""
    try:
        service = CustomFilterService(db)
        db_filter = service.create_filter(filter_data, current_user.id)

        # Adicionar resumo dos critérios
        db_filter.criteria_summary = db_filter.get_criteria_summary()

        return db_filter
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )

@router.get("/", response_model=List[CustomFilterList])
def list_custom_filters(
    include_public: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista filtros personalizados do usuário"""
    service = CustomFilterService(db)
    filters = service.get_filters_by_user(current_user.id, include_public)

    # Adicionar nome do proprietário
    result = []
    for filter_item in filters:
        filter_dict = {
            "id": filter_item.id,
            "name": filter_item.name,
            "description": filter_item.description,
            "scope": filter_item.scope,
            "color": filter_item.color,
            "icon": filter_item.icon,
            "is_default": filter_item.is_default,
            "sort_order": filter_item.sort_order,
            "is_active": filter_item.is_active,
            "created_at": filter_item.created_at,
            "criteria_summary": filter_item.get_criteria_summary(),
            "owner_name": filter_item.owner.full_name if filter_item.owner else "Usuário"
        }
        result.append(filter_dict)

    return result

@router.get("/{filter_id}", response_model=CustomFilterResponse)
def get_custom_filter(
    filter_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtém um filtro personalizado específico"""
    service = CustomFilterService(db)
    db_filter = service.get_filter_by_id(filter_id, current_user.id)

    if not db_filter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filtro não encontrado"
        )

    # Adicionar resumo dos critérios
    db_filter.criteria_summary = db_filter.get_criteria_summary()

    return db_filter

@router.put("/{filter_id}", response_model=CustomFilterResponse)
def update_custom_filter(
    filter_id: int,
    filter_data: CustomFilterUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualiza um filtro personalizado"""
    try:
        service = CustomFilterService(db)
        db_filter = service.update_filter(filter_id, filter_data, current_user.id)

        if not db_filter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Filtro não encontrado ou sem permissão"
            )

        # Adicionar resumo dos critérios
        db_filter.criteria_summary = db_filter.get_criteria_summary()

        return db_filter
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )

@router.delete("/{filter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_filter(
    filter_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove um filtro personalizado"""
    service = CustomFilterService(db)
    success = service.delete_filter(filter_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filtro não encontrado ou sem permissão"
        )

@router.post("/{filter_id}/duplicate", response_model=CustomFilterResponse, status_code=status.HTTP_201_CREATED)
def duplicate_custom_filter(
    filter_id: int,
    new_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Duplica um filtro personalizado"""
    service = CustomFilterService(db)
    new_filter = service.duplicate_filter(filter_id, current_user.id, new_name)

    if not new_filter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filtro não encontrado"
        )

    # Adicionar resumo dos critérios
    new_filter.criteria_summary = new_filter.get_criteria_summary()

    return new_filter

@router.post("/{filter_id}/set-default", status_code=status.HTTP_200_OK)
def set_default_filter(
    filter_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Define um filtro como padrão"""
    service = CustomFilterService(db)
    success = service.set_default_filter(filter_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filtro não encontrado ou sem permissão"
        )

    return {"message": "Filtro definido como padrão"}

@router.get("/default/current", response_model=Optional[CustomFilterResponse])
def get_default_filter(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtém o filtro padrão do usuário"""
    service = CustomFilterService(db)
    default_filter = service.get_default_filter(current_user.id)

    if default_filter:
        # Adicionar resumo dos critérios
        default_filter.criteria_summary = default_filter.get_criteria_summary()

    return default_filter

@router.get("/search/{query}", response_model=List[CustomFilterList])
def search_custom_filters(
    query: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Busca filtros por nome ou descrição"""
    if len(query.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query deve ter pelo menos 2 caracteres"
        )

    service = CustomFilterService(db)
    filters = service.search_filters(query, current_user.id)

    # Adicionar nome do proprietário
    result = []
    for filter_item in filters:
        filter_dict = {
            "id": filter_item.id,
            "name": filter_item.name,
            "description": filter_item.description,
            "scope": filter_item.scope,
            "color": filter_item.color,
            "icon": filter_item.icon,
            "is_default": filter_item.is_default,
            "sort_order": filter_item.sort_order,
            "is_active": filter_item.is_active,
            "created_at": filter_item.created_at,
            "criteria_summary": filter_item.get_criteria_summary(),
            "owner_name": filter_item.owner.full_name if filter_item.owner else "Usuário"
        }
        result.append(filter_dict)

    return result

