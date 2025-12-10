from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from ....core.database import get_db
from ....models.user import User
from ....models.agenda_event import AgendaEvent, EventType, EventStatus
from ....schemas.agenda_event import (
    AgendaEventCreate,
    AgendaEventUpdate,
    AgendaEventResponse,
    AgendaEventListResponse,
    AgendaEventFilter
)
from ....services.agenda_event_service import AgendaEventService
# from ....core.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=AgendaEventResponse)
def create_agenda_event(
    event_data: AgendaEventCreate,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # Temporariamente desabilitado para teste
):
    """Criar novo evento na agenda"""
    service = AgendaEventService(db)
    return service.create_event(event_data)

@router.get("/", response_model=AgendaEventListResponse)
def get_agenda_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    event_type: Optional[EventType] = Query(None),
    status: Optional[EventStatus] = Query(None),
    project_id: Optional[int] = Query(None),
    location_id: Optional[int] = Query(None),
    priority: Optional[int] = Query(None),
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # Temporariamente desabilitado para teste
):
    """Buscar eventos da agenda com filtros"""
    service = AgendaEventService(db)

    filters = AgendaEventFilter(
        start_date=start_date,
        end_date=end_date,
        event_type=event_type,
        status=status,
        project_id=project_id,
        location_id=location_id,
        priority=priority
    )

    events = service.get_events(skip=skip, limit=limit, filters=filters)
    total = len(events)  # Simplificado para demonstração

    return AgendaEventListResponse(
        events=events,
        total=total,
        page=skip // limit + 1,
        size=limit,
        total_pages=(total + limit - 1) // limit
    )

@router.get("/date-range", response_model=List[AgendaEventResponse])
def get_events_by_date_range(
    start_date: date = Query(..., description="Data de início"),
    end_date: date = Query(..., description="Data de fim"),
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # Temporariamente desabilitado para teste
):
    """Buscar eventos por período"""
    service = AgendaEventService(db)
    return service.get_events_by_date_range(start_date, end_date)

@router.get("/upcoming", response_model=List[AgendaEventResponse])
def get_upcoming_events(
    days: int = Query(7, ge=1, le=30, description="Número de dias para buscar"),
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # Temporariamente desabilitado para teste
):
    """Buscar eventos próximos"""
    service = AgendaEventService(db)
    return service.get_upcoming_events(days)

@router.get("/by-type/{event_type}", response_model=List[AgendaEventResponse])
def get_events_by_type(
    event_type: EventType,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # Temporariamente desabilitado para teste
):
    """Buscar eventos por tipo"""
    service = AgendaEventService(db)
    return service.get_events_by_type(event_type)

@router.get("/{event_id}", response_model=AgendaEventResponse)
def get_agenda_event(
    event_id: int,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # Temporariamente desabilitado para teste
):
    """Buscar evento por ID"""
    service = AgendaEventService(db)
    event = service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return event

@router.put("/{event_id}", response_model=AgendaEventResponse)
def update_agenda_event(
    event_id: int,
    event_data: AgendaEventUpdate,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # Temporariamente desabilitado para teste
):
    """Atualizar evento"""
    service = AgendaEventService(db)
    event = service.update_event(event_id, event_data)
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return event

@router.delete("/{event_id}")
def delete_agenda_event(
    event_id: int,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # Temporariamente desabilitado para teste
):
    """Deletar evento"""
    service = AgendaEventService(db)
    success = service.delete_event(event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return {"message": "Evento deletado com sucesso"}

@router.post("/generate-from-project-location/{project_location_id}")
def generate_events_from_project_location(
    project_location_id: int,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # Temporariamente desabilitado para teste
):
    """Gerar eventos automaticamente para uma locação de projeto"""
    from ....models.project_location import ProjectLocation

    project_location = db.query(ProjectLocation).filter(
        ProjectLocation.id == project_location_id
    ).first()

    if not project_location:
        raise HTTPException(status_code=404, detail="Locação de projeto não encontrada")

    service = AgendaEventService(db)
    events = service.create_events_from_project_location(project_location)

    return {
        "message": f"{len(events)} eventos criados com sucesso",
        "events": events
    }

@router.post("/generate-from-project/{project_id}")
def generate_events_from_project(
    project_id: int,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # Temporariamente desabilitado para teste
):
    """Gerar eventos automaticamente para um projeto"""
    from ....models.project import Project

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    service = AgendaEventService(db)
    events = service.create_events_from_project(project)

    return {
        "message": f"{len(events)} eventos criados com sucesso",
        "events": events
    }
