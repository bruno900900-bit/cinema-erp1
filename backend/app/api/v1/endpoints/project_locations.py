from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ....schemas.project_location import (
    ProjectLocationCreate,
    ProjectLocationUpdate,
    ProjectLocationResponse,
    ProjectLocationFilter,
    ProjectLocationCostSummary,
    ProjectLocationTimeline
)
from ....services.project_location_service import ProjectLocationService
from ....core.database import get_db

router = APIRouter(prefix="/project-locations", tags=["project-locations"])

@router.post("/", response_model=ProjectLocationResponse)
def create_project_location(
    location_data: ProjectLocationCreate,
    db: Session = Depends(get_db),
    current_user_id: int = 1  # TODO: Implementar autenticação
):
    """Cria uma nova locação em um projeto"""
    try:
        print(f"DEBUG: Received create_project_location request. Data: {location_data}")
        location_service = ProjectLocationService(db)
        project_location = location_service.create_project_location(location_data)
        return project_location
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.get("/", response_model=List[ProjectLocationResponse])
def get_project_locations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    project_id: Optional[int] = Query(None),
    location_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None, description="Status separados por vírgula"),
    responsible_user_ids: Optional[str] = Query(None, description="IDs dos responsáveis separados por vírgula"),
    is_overdue: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(None),
    date_from: Optional[str] = Query(None, description="Data inicial (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Data final (YYYY-MM-DD)"),
    min_cost: Optional[float] = Query(None),
    max_cost: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    """Lista locações de projeto com filtros"""
    try:
        # Construir filtros
        filters = ProjectLocationFilter()

        if project_id:
            filters.project_ids = [project_id]

        if location_id:
            filters.location_ids = [location_id]

        if status:
            from ....models.project_location import RentalStatus
            filters.status = [RentalStatus(x.strip()) for x in status.split(",")]

        if responsible_user_ids:
            filters.responsible_user_ids = [int(x.strip()) for x in responsible_user_ids.split(",")]

        if is_overdue is not None:
            filters.is_overdue = is_overdue

        if is_active is not None:
            filters.is_active = is_active

        if date_from and date_to:
            from datetime import date
            filters.date_from = date.fromisoformat(date_from)
            filters.date_to = date.fromisoformat(date_to)

        if min_cost:
            filters.min_cost = min_cost

        if max_cost:
            filters.max_cost = max_cost

        location_service = ProjectLocationService(db)

        if project_id and not any([status, responsible_user_ids, is_overdue, is_active, date_from, date_to, min_cost, max_cost]):
            # Buscar por projeto específico
            locations = location_service.get_project_locations_by_project(project_id)
        else:
            # Buscar com filtros
            locations = location_service.get_project_locations_with_filters(filters, skip, limit)

        return locations
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.get("/{location_id}", response_model=ProjectLocationResponse)
def get_project_location(location_id: int, db: Session = Depends(get_db)):
    """Obtém detalhes de uma locação específica de projeto"""
    location_service = ProjectLocationService(db)
    project_location = location_service.get_project_location(location_id)

    if not project_location:
        raise HTTPException(status_code=404, detail="Locação de projeto não encontrada")

    return project_location

@router.put("/{location_id}", response_model=ProjectLocationResponse)
def update_project_location(
    location_id: int,
    location_data: ProjectLocationUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza uma locação de projeto"""
    location_service = ProjectLocationService(db)
    project_location = location_service.update_project_location(location_id, location_data)

    if not project_location:
        raise HTTPException(status_code=404, detail="Locação de projeto não encontrada")

    return project_location

@router.delete("/{location_id}")
def delete_project_location(location_id: int, db: Session = Depends(get_db)):
    """Remove uma locação de projeto"""
    location_service = ProjectLocationService(db)
    success = location_service.delete_project_location(location_id)

    if not success:
        raise HTTPException(status_code=404, detail="Locação de projeto não encontrada")

    return {"message": "Locação de projeto removida com sucesso"}

@router.get("/project/{project_id}/cost-summary")
def get_project_cost_summary(project_id: int, db: Session = Depends(get_db)):
    """Obtém resumo de custos de um projeto"""
    try:
        location_service = ProjectLocationService(db)
        summary = location_service.get_project_cost_summary(project_id)

        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.get("/project/{project_id}/timeline")
def get_project_timeline(project_id: int, db: Session = Depends(get_db)):
    """Obtém timeline de locações de um projeto"""
    try:
        location_service = ProjectLocationService(db)
        timeline = location_service.get_project_timeline(project_id)

        return timeline
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.post("/{location_id}/update-progress")
def update_location_progress(location_id: int, db: Session = Depends(get_db)):
    """Atualiza o progresso de uma locação baseado nas etapas"""
    try:
        location_service = ProjectLocationService(db)
        location_service.update_location_progress(location_id)

        return {"message": "Progresso atualizado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno do servidor")
