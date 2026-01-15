"""
API endpoints para locações visitadas em projetos.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
from datetime import datetime

from ....schemas.project_visit_location import (
    VisitLocationCreate,
    VisitLocationUpdate,
    VisitLocationResponse,
    VisitLocationBrief,
    VisitPhotoCreate,
    VisitPhotoResponse,
    PhotoCommentCreate,
    PhotoCommentResponse,
    WorkflowStageCreate,
    WorkflowStageUpdate,
    WorkflowStageResponse,
)
from ....services.project_visit_location_service import ProjectVisitLocationService
from ....core.database import get_db

router = APIRouter(prefix="/project-visit-locations", tags=["project-visit-locations"])

# Diretório para upload de fotos
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "uploads", "visit_photos")


# ========== Visit Locations ==========

@router.post("/", response_model=VisitLocationResponse)
def create_visit_location(
    data: VisitLocationCreate,
    db: Session = Depends(get_db),
):
    """Cria uma nova locação visitada"""
    try:
        service = ProjectVisitLocationService(db)
        location = service.create_visit_location(data)
        return location
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get("/", response_model=List[VisitLocationBrief])
def list_visit_locations(
    project_id: int = Query(..., description="ID do projeto"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    db: Session = Depends(get_db),
):
    """Lista locações visitadas de um projeto"""
    try:
        service = ProjectVisitLocationService(db)
        locations = service.get_visit_locations_by_project(project_id)

        # Filtrar por status se especificado
        if status:
            from ....models.project_visit_location import VisitLocationStatus
            status_filter = VisitLocationStatus(status)
            locations = [loc for loc in locations if loc.status == status_filter]

        return locations
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get("/{location_id}", response_model=VisitLocationResponse)
def get_visit_location(
    location_id: int,
    db: Session = Depends(get_db),
):
    """Obtém detalhes de uma locação visitada"""
    service = ProjectVisitLocationService(db)
    location = service.get_visit_location(location_id)

    if not location:
        raise HTTPException(status_code=404, detail="Locação visitada não encontrada")

    return location


@router.put("/{location_id}", response_model=VisitLocationResponse)
def update_visit_location(
    location_id: int,
    data: VisitLocationUpdate,
    db: Session = Depends(get_db),
):
    """Atualiza uma locação visitada"""
    service = ProjectVisitLocationService(db)
    location = service.update_visit_location(location_id, data)

    if not location:
        raise HTTPException(status_code=404, detail="Locação visitada não encontrada")

    return location


@router.delete("/{location_id}")
def delete_visit_location(
    location_id: int,
    db: Session = Depends(get_db),
):
    """Remove uma locação visitada"""
    service = ProjectVisitLocationService(db)
    success = service.delete_visit_location(location_id)

    if not success:
        raise HTTPException(status_code=404, detail="Locação visitada não encontrada")

    return {"message": "Locação visitada removida com sucesso"}


# ========== Photos ==========

@router.post("/{location_id}/photos", response_model=VisitPhotoResponse)
async def upload_photo(
    location_id: int,
    file: UploadFile = File(...),
    caption: Optional[str] = None,
    user_id: int = Query(1, description="ID do usuário que está fazendo upload"),
    db: Session = Depends(get_db),
):
    """Faz upload de uma foto para a locação visitada"""
    try:
        # Verificar se a locação existe
        service = ProjectVisitLocationService(db)
        location = service.get_visit_location(location_id)
        if not location:
            raise HTTPException(status_code=404, detail="Locação visitada não encontrada")

        # Criar diretório de upload se não existir
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        # Gerar nome único para o arquivo
        ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        # Salvar o arquivo
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        # Criar registro no banco
        photo_data = VisitPhotoCreate(
            visit_location_id=location_id,
            filename=unique_filename,
            original_filename=file.filename,
            file_path=file_path,
            url=f"/uploads/visit_photos/{unique_filename}",
            caption=caption,
            uploaded_by_user_id=user_id,
            file_size=len(contents),
        )

        # Corrigir: VisitPhotoCreate não tem file_size, adicionar diretamente
        photo = service.add_photo(photo_data)

        # Atualizar file_size diretamente
        photo.file_size = len(contents)
        photo.mime_type = file.content_type
        db.commit()
        db.refresh(photo)

        return photo

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upload: {str(e)}")


@router.get("/{location_id}/photos", response_model=List[VisitPhotoResponse])
def get_photos(
    location_id: int,
    db: Session = Depends(get_db),
):
    """Lista fotos de uma locação visitada"""
    service = ProjectVisitLocationService(db)
    return service.get_photos_by_location(location_id)


@router.delete("/photos/{photo_id}")
def delete_photo(
    photo_id: int,
    db: Session = Depends(get_db),
):
    """Remove uma foto"""
    service = ProjectVisitLocationService(db)

    # Obter foto para deletar o arquivo
    photo = service.get_photo(photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada")

    # Deletar arquivo físico
    if photo.file_path and os.path.exists(photo.file_path):
        try:
            os.remove(photo.file_path)
        except Exception:
            pass  # Ignorar erro ao deletar arquivo

    success = service.delete_photo(photo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Foto não encontrada")

    return {"message": "Foto removida com sucesso"}


@router.put("/photos/{photo_id}/caption")
def update_photo_caption(
    photo_id: int,
    caption: str = Query(..., description="Nova legenda da foto"),
    db: Session = Depends(get_db),
):
    """Atualiza a legenda de uma foto"""
    service = ProjectVisitLocationService(db)
    photo = service.update_photo_caption(photo_id, caption)

    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada")

    return {"message": "Legenda atualizada com sucesso"}


# ========== Comments ==========

@router.post("/photos/{photo_id}/comments", response_model=PhotoCommentResponse)
def add_comment(
    photo_id: int,
    comment: str = Query(..., description="Texto do comentário"),
    user_id: int = Query(..., description="ID do usuário que está comentando"),
    db: Session = Depends(get_db),
):
    """Adiciona um comentário a uma foto"""
    try:
        service = ProjectVisitLocationService(db)

        # Verificar se a foto existe
        photo = service.get_photo(photo_id)
        if not photo:
            raise HTTPException(status_code=404, detail="Foto não encontrada")

        comment_data = PhotoCommentCreate(
            photo_id=photo_id,
            user_id=user_id,
            comment=comment,
        )
        new_comment = service.add_comment(comment_data)

        # Recarregar com relacionamentos
        db.refresh(new_comment)
        return new_comment

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao adicionar comentário: {str(e)}")


@router.get("/photos/{photo_id}/comments", response_model=List[PhotoCommentResponse])
def get_comments(
    photo_id: int,
    db: Session = Depends(get_db),
):
    """Lista comentários de uma foto"""
    service = ProjectVisitLocationService(db)
    return service.get_comments_by_photo(photo_id)


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
):
    """Remove um comentário"""
    service = ProjectVisitLocationService(db)
    success = service.delete_comment(comment_id)

    if not success:
        raise HTTPException(status_code=404, detail="Comentário não encontrado")

    return {"message": "Comentário removido com sucesso"}


# ========== Workflow Stages ==========

@router.post("/{location_id}/stages", response_model=WorkflowStageResponse)
def add_workflow_stage(
    location_id: int,
    title: str = Query(..., description="Título da etapa"),
    description: Optional[str] = Query(None, description="Descrição"),
    responsible_user_id: Optional[int] = Query(None, description="ID do responsável"),
    due_date: Optional[str] = Query(None, description="Data limite (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    """Adiciona uma etapa de workflow"""
    try:
        service = ProjectVisitLocationService(db)

        # Verificar se a locação existe
        location = service.get_visit_location(location_id)
        if not location:
            raise HTTPException(status_code=404, detail="Locação visitada não encontrada")

        # Parse da data
        parsed_due_date = None
        if due_date:
            from datetime import date
            parsed_due_date = date.fromisoformat(due_date)

        stage_data = WorkflowStageCreate(
            visit_location_id=location_id,
            title=title,
            description=description,
            responsible_user_id=responsible_user_id,
            due_date=parsed_due_date,
        )
        stage = service.add_workflow_stage(stage_data)

        # Recarregar com relacionamentos
        db.refresh(stage)
        return stage

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao adicionar etapa: {str(e)}")


@router.get("/{location_id}/stages", response_model=List[WorkflowStageResponse])
def get_workflow_stages(
    location_id: int,
    db: Session = Depends(get_db),
):
    """Lista etapas de workflow de uma locação"""
    service = ProjectVisitLocationService(db)
    return service.get_workflow_stages(location_id)


@router.put("/stages/{stage_id}", response_model=WorkflowStageResponse)
def update_workflow_stage(
    stage_id: int,
    data: WorkflowStageUpdate,
    user_id: int = Query(1, description="ID do usuário fazendo a atualização"),
    db: Session = Depends(get_db),
):
    """Atualiza uma etapa de workflow"""
    service = ProjectVisitLocationService(db)
    stage = service.update_workflow_stage(stage_id, data, user_id)

    if not stage:
        raise HTTPException(status_code=404, detail="Etapa não encontrada")

    return stage


@router.post("/stages/{stage_id}/complete")
def complete_workflow_stage(
    stage_id: int,
    user_id: int = Query(..., description="ID do usuário completando a etapa"),
    db: Session = Depends(get_db),
):
    """Marca uma etapa como concluída"""
    from ....models.project_visit_workflow import WorkflowStageStatus

    service = ProjectVisitLocationService(db)
    update_data = WorkflowStageUpdate(status=WorkflowStageStatus.COMPLETED)
    stage = service.update_workflow_stage(stage_id, update_data, user_id)

    if not stage:
        raise HTTPException(status_code=404, detail="Etapa não encontrada")

    return {"message": "Etapa marcada como concluída"}


@router.delete("/stages/{stage_id}")
def delete_workflow_stage(
    stage_id: int,
    db: Session = Depends(get_db),
):
    """Remove uma etapa de workflow"""
    service = ProjectVisitLocationService(db)
    success = service.delete_workflow_stage(stage_id)

    if not success:
        raise HTTPException(status_code=404, detail="Etapa não encontrada")

    return {"message": "Etapa removida com sucesso"}


@router.post("/{location_id}/stages/reorder")
def reorder_stages(
    location_id: int,
    stage_ids: List[int] = Query(..., description="IDs das etapas na nova ordem"),
    db: Session = Depends(get_db),
):
    """Reordena as etapas de workflow"""
    service = ProjectVisitLocationService(db)
    stages = service.reorder_stages(location_id, stage_ids)
    return {"message": "Etapas reordenadas com sucesso", "count": len(stages)}
