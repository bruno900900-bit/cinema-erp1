from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from ....schemas.project_location_stage import (
    ProjectLocationStageCreate,
    ProjectLocationStageUpdate,
    ProjectLocationStageResponse,
    ProjectLocationStageFilter,
    ProjectLocationStageProgress,
    ProjectLocationStageBulkUpdate,
    ProjectLocationStageTemplate,
    StageStatusUpdate,
    StageHistoryResponse
)
from ....services.project_location_stage_service import ProjectLocationStageService
from ....core.database import get_db
from ....core.auth import get_current_user
from ....models.user import User

router = APIRouter(prefix="/project-location-stages", tags=["project-location-stages"])

@router.post("/", response_model=ProjectLocationStageResponse)
def create_stage(
    stage_data: ProjectLocationStageCreate,
    db: Session = Depends(get_db),
    current_user_id: int = 1  # TODO: Implementar autenticação
):
    """Cria uma nova etapa de locação"""
    try:
        stage_service = ProjectLocationStageService(db)
        stage = stage_service.create_stage(stage_data)
        return stage
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.get("/", response_model=List[ProjectLocationStageResponse])
def get_stages(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    project_location_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    stage_types: Optional[str] = Query(None, description="Tipos de etapa separados por vírgula"),
    status: Optional[str] = Query(None, description="Status separados por vírgula"),
    responsible_user_ids: Optional[str] = Query(None, description="IDs dos responsáveis separados por vírgula"),
    is_overdue: Optional[bool] = Query(None),
    is_critical: Optional[bool] = Query(None),
    date_from: Optional[str] = Query(None, description="Data inicial (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Data final (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Lista etapas de locação com filtros"""
    try:
        # Construir filtros
        filters = ProjectLocationStageFilter()

        if project_location_id:
            filters.project_location_ids = [project_location_id]

        if stage_types:
            from ....models.project_location_stage import LocationStageType
            filters.stage_types = [LocationStageType(x.strip()) for x in stage_types.split(",")]

        if status:
            from ....models.project_location_stage import StageStatus
            filters.status = [StageStatus(x.strip()) for x in status.split(",")]

        if responsible_user_ids:
            filters.responsible_user_ids = [int(x.strip()) for x in responsible_user_ids.split(",")]

        if is_overdue is not None:
            filters.is_overdue = is_overdue

        if is_critical is not None:
            filters.is_critical = is_critical

        if date_from and date_to:
            from datetime import datetime
            filters.date_from = datetime.fromisoformat(date_from)
            filters.date_to = datetime.fromisoformat(date_to)

        stage_service = ProjectLocationStageService(db)

        if project_id:
            # Buscar por projeto
            stages = stage_service.get_stages_by_project(project_id)
        else:
            # Buscar com filtros
            stages = stage_service.get_stages_with_filters(filters, skip, limit)

        return stages
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.get("/{stage_id}", response_model=ProjectLocationStageResponse)
def get_stage(stage_id: int, db: Session = Depends(get_db)):
    """Obtém detalhes de uma etapa específica"""
    stage_service = ProjectLocationStageService(db)
    stage = stage_service.get_stage(stage_id)

    if not stage:
        raise HTTPException(status_code=404, detail="Etapa não encontrada")

    return stage

@router.put("/{stage_id}", response_model=ProjectLocationStageResponse)
def update_stage(
    stage_id: int,
    stage_data: ProjectLocationStageUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza uma etapa"""
    stage_service = ProjectLocationStageService(db)
    stage = stage_service.update_stage(stage_id, stage_data)

    if not stage:
        raise HTTPException(status_code=404, detail="Etapa não encontrada")

    return stage

@router.delete("/{stage_id}")
def delete_stage(stage_id: int, db: Session = Depends(get_db)):
    """Remove uma etapa"""
    stage_service = ProjectLocationStageService(db)
    success = stage_service.delete_stage(stage_id)

    if not success:
        raise HTTPException(status_code=404, detail="Etapa não encontrada")

    return {"message": "Etapa removida com sucesso"}

@router.post("/bulk-update")
def bulk_update_stages(
    bulk_data: ProjectLocationStageBulkUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza múltiplas etapas em lote"""
    try:
        stage_service = ProjectLocationStageService(db)
        updated_count = 0

        for stage_id in bulk_data.stage_ids:
            update_data = ProjectLocationStageUpdate(
                status=bulk_data.status,
                completion_percentage=bulk_data.completion_percentage,
                responsible_user_id=bulk_data.responsible_user_id,
                notes=bulk_data.notes
            )
            stage = stage_service.update_stage(stage_id, update_data)
            if stage:
                updated_count += 1

        return {"message": f"{updated_count} etapas atualizadas com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.post("/create-default/{project_location_id}")
def create_default_stages(
    project_location_id: int,
    templates: Optional[List[ProjectLocationStageTemplate]] = Body(None),
    db: Session = Depends(get_db)
):
    """Cria etapas padrão para uma locação"""
    try:
        stage_service = ProjectLocationStageService(db)
        stages = stage_service.create_default_stages(project_location_id, templates)

        return {
            "message": f"{len(stages)} etapas criadas com sucesso",
            "stages": stages
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.get("/project/{project_id}/progress")
def get_project_progress_summary(project_id: int, db: Session = Depends(get_db)):
    """Obtém resumo do progresso de um projeto"""
    try:
        stage_service = ProjectLocationStageService(db)
        summary = stage_service.get_project_progress_summary(project_id)

        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.get("/templates/default")
def get_default_templates():
    """Obtém templates padrão para etapas"""
    from ....services.project_location_stage_service import ProjectLocationStageService
    stage_service = ProjectLocationStageService(None)  # Não precisa de DB para templates
    templates = stage_service._get_default_templates()

    return {"templates": templates}

@router.patch("/{stage_id}/status", response_model=ProjectLocationStageResponse)
def update_stage_status(
    stage_id: int,
    status_update: StageStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza o status de uma etapa com rastreamento de usuário"""
    try:
        stage_service = ProjectLocationStageService(db)
        stage = stage_service.update_stage_status(
            stage_id=stage_id,
            new_status=status_update.status,
            user_id=current_user.id,
            notes=status_update.notes
        )
        return stage
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar status: {str(e)}")

@router.get("/{stage_id}/history", response_model=List[StageHistoryResponse])
def get_stage_history(
    stage_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna o histórico completo de mudanças de status de uma etapa"""
    try:
        stage_service = ProjectLocationStageService(db)

        # Verifica se a etapa existe
        stage = stage_service.get_stage(stage_id)
        if not stage:
            raise HTTPException(status_code=404, detail="Etapa não encontrada")

        history = stage_service.get_stage_history(stage_id)
        return history
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar histórico: {str(e)}")
