from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ....schemas.visit import (
    VisitCreate, 
    VisitUpdate, 
    VisitResponse, 
    VisitFilter,
    VisitParticipantCreate,
    VisitParticipantUpdate,
    VisitParticipantResponse
)
from ....services.visit_service import VisitService
from ....core.database import get_db

router = APIRouter(prefix="/visits", tags=["visits"])

@router.post("/", response_model=VisitResponse)
def create_visit(
    visit_data: VisitCreate,
    db: Session = Depends(get_db),
    current_user_id: int = 1  # TODO: Implementar autenticação
):
    """Cria uma nova visita"""
    try:
        visit_service = VisitService(db)
        return visit_service.create_visit(visit_data, current_user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.get("/", response_model=List[VisitResponse])
def get_visits(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    date_from: Optional[str] = Query(None, description="Data inicial (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Data final (YYYY-MM-DD)"),
    project_ids: Optional[str] = Query(None, description="IDs dos projetos separados por vírgula"),
    location_ids: Optional[str] = Query(None, description="IDs das locações separados por vírgula"),
    user_ids: Optional[str] = Query(None, description="IDs dos usuários separados por vírgula"),
    etapas: Optional[str] = Query(None, description="Etapas separadas por vírgula"),
    status: Optional[str] = Query(None, description="Status separados por vírgula"),
    db: Session = Depends(get_db)
):
    """Lista visitas com filtros avançados"""
    # Construir filtros
    filters = VisitFilter()
    
    if date_from and date_to:
        filters.date_range = {"from": date_from, "to": date_to}
    
    if project_ids:
        filters.project_ids = [int(x.strip()) for x in project_ids.split(",")]
    
    if location_ids:
        filters.location_ids = [int(x.strip()) for x in location_ids.split(",")]
    
    if user_ids:
        filters.user_ids = [int(x.strip()) for x in user_ids.split(",")]
    
    if etapas:
        from ....models.visit import VisitEtapa
        filters.etapas = [VisitEtapa(x.strip()) for x in etapas.split(",")]
    
    if status:
        from ....models.visit import VisitStatus
        filters.status = [VisitStatus(x.strip()) for x in status.split(",")]
    
    visit_service = VisitService(db)
    return visit_service.get_visits(filters=filters, skip=skip, limit=limit)

@router.get("/{visit_id}", response_model=VisitResponse)
def get_visit(visit_id: int, db: Session = Depends(get_db)):
    """Obtém detalhes de uma visita específica"""
    visit_service = VisitService(db)
    visit = visit_service.get_visit(visit_id)
    
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    
    return visit

@router.patch("/{visit_id}", response_model=VisitResponse)
def update_visit(
    visit_id: int,
    visit_data: VisitUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza uma visita existente"""
    visit_service = VisitService(db)
    visit = visit_service.update_visit(visit_id, visit_data)
    
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    
    return visit

@router.delete("/{visit_id}")
def delete_visit(visit_id: int, db: Session = Depends(get_db)):
    """Cancela uma visita (soft delete)"""
    visit_service = VisitService(db)
    success = visit_service.delete_visit(visit_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    
    return {"message": "Visita cancelada com sucesso"}

@router.patch("/{visit_id}/complete", response_model=VisitResponse)
def complete_visit(visit_id: int, db: Session = Depends(get_db)):
    """Marca uma visita como concluída"""
    visit_service = VisitService(db)
    visit = visit_service.complete_visit(visit_id)
    
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    
    return visit

# Endpoints para participantes
@router.post("/{visit_id}/participants", response_model=VisitParticipantResponse)
def add_participant(
    visit_id: int,
    participant_data: VisitParticipantCreate,
    db: Session = Depends(get_db)
):
    """Adiciona um participante a uma visita"""
    try:
        visit_service = VisitService(db)
        return visit_service.add_participant(visit_id, participant_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{visit_id}/participants/{user_id}", response_model=VisitParticipantResponse)
def update_participant(
    visit_id: int,
    user_id: int,
    participant_data: VisitParticipantUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza dados de um participante"""
    visit_service = VisitService(db)
    participant = visit_service.update_participant(visit_id, user_id, participant_data)
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participante não encontrado")
    
    return participant

@router.delete("/{visit_id}/participants/{user_id}")
def remove_participant(visit_id: int, user_id: int, db: Session = Depends(get_db)):
    """Remove um participante de uma visita"""
    visit_service = VisitService(db)
    success = visit_service.remove_participant(visit_id, user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Participante não encontrado")
    
    return {"message": "Participante removido com sucesso"}

@router.post("/{visit_id}/participants/{user_id}/check-in", response_model=VisitParticipantResponse)
def check_in_participant(visit_id: int, user_id: int, db: Session = Depends(get_db)):
    """Registra check-in de um participante"""
    visit_service = VisitService(db)
    participant = visit_service.check_in_participant(visit_id, user_id)
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participante não encontrado")
    
    return participant

@router.post("/{visit_id}/participants/{user_id}/check-out", response_model=VisitParticipantResponse)
def check_out_participant(visit_id: int, user_id: int, db: Session = Depends(get_db)):
    """Registra check-out de um participante"""
    visit_service = VisitService(db)
    participant = visit_service.check_out_participant(visit_id, user_id)
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participante não encontrado")
    
    return participant
