"""
API Endpoints para Etapas do Projeto (Project Stages)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ....core.database import get_db
from ....services.project_stage_service import ProjectStageService
from ....schemas.project_stage import (
    ProjectStageCreate,
    ProjectStageUpdate,
    ProjectStageResponse,
    ProjectStageBrief,
    StageTaskCreate,
    StageTaskUpdate,
    StageTaskResponse,
)

router = APIRouter(tags=["Project Stages"])


# ========== Project Stages ==========

@router.post("/", response_model=ProjectStageResponse, status_code=status.HTTP_201_CREATED)
async def create_stage(
    data: ProjectStageCreate,
    db: Session = Depends(get_db)
):
    """Cria uma nova etapa para um projeto"""
    service = ProjectStageService(db)
    stage = service.create_stage(data)
    return stage


@router.post("/projects/{project_id}/stages/initialize", response_model=List[ProjectStageBrief])
async def initialize_project_stages(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Cria as etapas padrão para um projeto (usar ao criar novo projeto)"""
    service = ProjectStageService(db)

    # Verificar se já existem etapas
    existing = service.get_stages_by_project(project_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este projeto já possui etapas definidas"
        )

    stages = service.create_default_stages(project_id)
    return [
        ProjectStageBrief(
            id=s.id,
            project_id=s.project_id,
            name=s.name,
            stage_type=s.stage_type.value,
            status=s.status.value,
            order_index=s.order_index,
            tasks_count=len(s.tasks) if s.tasks else 0,
            completed_tasks_count=0
        )
        for s in stages
    ]


@router.get("/projects/{project_id}/stages", response_model=List[ProjectStageResponse])
async def get_project_stages(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Lista todas as etapas de um projeto"""
    service = ProjectStageService(db)
    stages = service.get_stages_by_project(project_id)
    return stages


@router.get("/{stage_id}", response_model=ProjectStageResponse)
async def get_stage(
    stage_id: int,
    db: Session = Depends(get_db)
):
    """Obtém uma etapa específica com suas tarefas"""
    service = ProjectStageService(db)
    stage = service.get_stage(stage_id)
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Etapa não encontrada"
        )
    return stage


@router.put("/{stage_id}", response_model=ProjectStageResponse)
async def update_stage(
    stage_id: int,
    data: ProjectStageUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza uma etapa"""
    service = ProjectStageService(db)
    stage = service.update_stage(stage_id, data)
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Etapa não encontrada"
        )
    return stage


@router.delete("/{stage_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stage(
    stage_id: int,
    db: Session = Depends(get_db)
):
    """Remove uma etapa"""
    service = ProjectStageService(db)
    if not service.delete_stage(stage_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Etapa não encontrada"
        )


@router.post("/projects/{project_id}/stages/reorder", response_model=List[ProjectStageBrief])
async def reorder_stages(
    project_id: int,
    stage_ids: List[int],
    db: Session = Depends(get_db)
):
    """Reordena as etapas de um projeto"""
    service = ProjectStageService(db)
    stages = service.reorder_stages(project_id, stage_ids)
    return [
        ProjectStageBrief(
            id=s.id,
            project_id=s.project_id,
            name=s.name,
            stage_type=s.stage_type.value,
            status=s.status.value,
            order_index=s.order_index,
            tasks_count=len(s.tasks) if s.tasks else 0,
            completed_tasks_count=len([t for t in (s.tasks or []) if t.status.value == 'completed'])
        )
        for s in stages
    ]


# ========== Stage Tasks ==========

@router.post("/{stage_id}/tasks", response_model=StageTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    stage_id: int,
    title: str,
    description: str = None,
    due_date: str = None,
    assigned_user_id: int = None,
    priority: str = "medium",
    user_id: int = 1,  # TODO: pegar do auth
    db: Session = Depends(get_db)
):
    """Cria uma tarefa em uma etapa"""
    from datetime import date
    service = ProjectStageService(db)

    task_data = StageTaskCreate(
        stage_id=stage_id,
        title=title,
        description=description,
        due_date=date.fromisoformat(due_date) if due_date else None,
        priority=priority,
        created_by_user_id=user_id,
    )

    task = service.create_task(task_data)

    # Atualizar assigned_user_id se fornecido
    if assigned_user_id:
        from ..schemas.project_stage import StageTaskUpdate
        service.update_task(task.id, StageTaskUpdate(assigned_user_id=assigned_user_id))
        task = service.get_task(task.id)

    return task


@router.get("/{stage_id}/tasks", response_model=List[StageTaskResponse])
async def get_stage_tasks(
    stage_id: int,
    db: Session = Depends(get_db)
):
    """Lista tarefas de uma etapa"""
    service = ProjectStageService(db)
    return service.get_tasks_by_stage(stage_id)


@router.put("/tasks/{task_id}", response_model=StageTaskResponse)
async def update_task(
    task_id: int,
    data: StageTaskUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza uma tarefa"""
    service = ProjectStageService(db)
    task = service.update_task(task_id, data)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada"
        )
    return task


@router.post("/tasks/{task_id}/complete", response_model=StageTaskResponse)
async def complete_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """Marca uma tarefa como concluída"""
    service = ProjectStageService(db)
    task = service.complete_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada"
        )
    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """Remove uma tarefa"""
    service = ProjectStageService(db)
    if not service.delete_task(task_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada"
        )
