from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import math

from ....core.database import get_db
from ....models.user import User
from ....models.location_demand import LocationDemand, DemandPriority, DemandStatus
from ....schemas.location_demand import (
    LocationDemandCreate,
    LocationDemandUpdate,
    LocationDemandResponse,
    LocationDemandListResponse,
    LocationDemandFilter,
    LocationDemandSummary
)
from ....services.location_demand_service import LocationDemandService
# from ....core.auth import get_current_user

router = APIRouter()


def _enrich_demand_response(demand: LocationDemand) -> dict:
    """Add computed fields and related data to demand response"""
    # Determine location name based on type
    location_name = None
    if demand.project_location and demand.project_location.location:
        location_name = demand.project_location.location.title
    elif demand.visit_location:
        location_name = demand.visit_location.name

    response = {
        "id": demand.id,
        "title": demand.title,
        "description": demand.description,
        "priority": demand.priority,
        "status": demand.status,
        "category": demand.category,
        "project_location_id": demand.project_location_id,
        "visit_location_id": demand.visit_location_id,
        "project_id": demand.project_id,
        "assigned_user_id": demand.assigned_user_id,
        "created_by_user_id": demand.created_by_user_id,
        "due_date": demand.due_date,
        "completed_at": demand.completed_at,
        "agenda_event_id": demand.agenda_event_id,
        "notes": demand.notes,
        "attachments_json": demand.attachments_json,
        "created_at": demand.created_at,
        "updated_at": demand.updated_at,
        "is_overdue": demand.is_overdue,
        "assigned_user_name": demand.assigned_user.name if demand.assigned_user else None,
        "created_by_user_name": demand.created_by_user.name if demand.created_by_user else None,
        "location_name": location_name,
    }
    return response


@router.post("/", response_model=LocationDemandResponse)
def create_demand(
    demand_data: LocationDemandCreate,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """Criar nova demanda"""
    service = LocationDemandService(db)
    # TODO: Use current_user.id when auth is enabled
    demand = service.create_demand(demand_data, created_by_user_id=1)
    return _enrich_demand_response(demand)


@router.get("/", response_model=LocationDemandListResponse)
def get_demands(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: Optional[int] = Query(None, description="Filtrar por projeto"),
    project_location_id: Optional[int] = Query(None, description="Filtrar por locação"),
    status: Optional[DemandStatus] = Query(None, description="Filtrar por status"),
    priority: Optional[DemandPriority] = Query(None, description="Filtrar por prioridade"),
    assigned_user_id: Optional[int] = Query(None, description="Filtrar por responsável"),
    category: Optional[str] = Query(None, description="Filtrar por categoria"),
    overdue_only: bool = Query(False, description="Mostrar apenas atrasadas"),
    due_date_from: Optional[datetime] = Query(None, description="Vencimento a partir de"),
    due_date_to: Optional[datetime] = Query(None, description="Vencimento até"),
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """Buscar demandas com filtros e paginação"""
    service = LocationDemandService(db)

    filters = LocationDemandFilter(
        project_id=project_id,
        project_location_id=project_location_id,
        status=status,
        priority=priority,
        assigned_user_id=assigned_user_id,
        category=category,
        overdue_only=overdue_only,
        due_date_from=due_date_from,
        due_date_to=due_date_to
    )

    demands, total = service.get_demands(skip=skip, limit=limit, filters=filters)

    return LocationDemandListResponse(
        demands=[_enrich_demand_response(d) for d in demands],
        total=total,
        page=skip // limit + 1,
        size=limit,
        total_pages=math.ceil(total / limit) if total > 0 else 1
    )


@router.get("/summary", response_model=LocationDemandSummary)
def get_demands_summary(
    project_id: Optional[int] = Query(None, description="ID do projeto"),
    project_location_id: Optional[int] = Query(None, description="ID da locação"),
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """Obter resumo das demandas"""
    service = LocationDemandService(db)
    return service.get_summary(project_id=project_id, project_location_id=project_location_id)


@router.get("/by-location/{project_location_id}", response_model=List[LocationDemandResponse])
def get_demands_by_location(
    project_location_id: int,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """Buscar todas as demandas de uma locação"""
    service = LocationDemandService(db)
    demands = service.get_demands_by_location(project_location_id)
    return [_enrich_demand_response(d) for d in demands]


@router.get("/by-project/{project_id}", response_model=List[LocationDemandResponse])
def get_demands_by_project(
    project_id: int,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """Buscar todas as demandas de um projeto"""
    service = LocationDemandService(db)
    demands = service.get_demands_by_project(project_id)
    return [_enrich_demand_response(d) for d in demands]


@router.get("/by-visit-location/{visit_location_id}", response_model=List[LocationDemandResponse])
def get_demands_by_visit_location(
    visit_location_id: int,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """Buscar todas as demandas de uma locação visitada"""
    service = LocationDemandService(db)
    demands = service.get_demands_by_visit_location(visit_location_id)
    return [_enrich_demand_response(d) for d in demands]


@router.get("/my-demands", response_model=List[LocationDemandResponse])
def get_my_demands(
    user_id: int = Query(..., description="ID do usuário atual"),
    include_created: bool = Query(False, description="Incluir demandas criadas pelo usuário"),
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """Buscar demandas atribuídas ao usuário (e opcionalmente criadas por ele)"""
    service = LocationDemandService(db)

    # Get demands assigned to user
    assigned_demands = service.get_demands_by_assigned_user(user_id)

    if include_created:
        # Also get demands created by user
        created_demands = service.get_demands_created_by_user(user_id)
        # Merge and deduplicate
        all_demand_ids = set()
        all_demands = []
        for d in assigned_demands + created_demands:
            if d.id not in all_demand_ids:
                all_demand_ids.add(d.id)
                all_demands.append(d)
        # Sort by priority and due_date
        all_demands.sort(key=lambda x: (
            -{'urgent': 4, 'high': 3, 'medium': 2, 'low': 1}.get(x.priority.value if hasattr(x.priority, 'value') else x.priority, 2),
            x.due_date or datetime.max
        ))
        return [_enrich_demand_response(d) for d in all_demands]

    return [_enrich_demand_response(d) for d in assigned_demands]


@router.get("/by-assigned-user/{user_id}", response_model=List[LocationDemandResponse])
def get_demands_by_assigned_user(
    user_id: int,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """Buscar todas as demandas atribuídas a um usuário específico"""
    service = LocationDemandService(db)
    demands = service.get_demands_by_assigned_user(user_id)
    return [_enrich_demand_response(d) for d in demands]


@router.get("/by-creator/{user_id}", response_model=List[LocationDemandResponse])
def get_demands_by_creator(
    user_id: int,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """Buscar todas as demandas criadas por um usuário específico"""
    service = LocationDemandService(db)
    demands = service.get_demands_created_by_user(user_id)
    return [_enrich_demand_response(d) for d in demands]


@router.get("/{demand_id}", response_model=LocationDemandResponse)
def get_demand(
    demand_id: int,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """Buscar demanda por ID"""
    service = LocationDemandService(db)
    demand = service.get_demand(demand_id)
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")
    return _enrich_demand_response(demand)


@router.put("/{demand_id}", response_model=LocationDemandResponse)
def update_demand(
    demand_id: int,
    demand_data: LocationDemandUpdate,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """Atualizar demanda"""
    service = LocationDemandService(db)
    demand = service.update_demand(demand_id, demand_data)
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")
    return _enrich_demand_response(demand)


@router.patch("/{demand_id}/status")
def update_demand_status(
    demand_id: int,
    status: DemandStatus,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """Atualizar apenas o status da demanda"""
    service = LocationDemandService(db)
    demand = service.update_demand(demand_id, LocationDemandUpdate(status=status))
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")
    return {"message": f"Status atualizado para {status.value}", "demand_id": demand_id}


@router.delete("/{demand_id}")
def delete_demand(
    demand_id: int,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """Deletar demanda"""
    service = LocationDemandService(db)
    success = service.delete_demand(demand_id)
    if not success:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")
    return {"message": "Demanda deletada com sucesso"}
