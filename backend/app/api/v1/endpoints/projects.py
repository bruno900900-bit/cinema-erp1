from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ....schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from ....services.project_service import ProjectService
from ....core.database import get_db
from ....core.auth import get_current_user
from ....models.user import User

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("/", response_model=ProjectResponse)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria um novo projeto"""
    project_service = ProjectService(db)
    return project_service.create_project(project_data)

@router.get("/", response_model=List[ProjectResponse])
def get_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista projetos"""
    project_service = ProjectService(db)
    return project_service.get_projects(skip=skip, limit=limit)

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Obtém detalhes de um projeto específico"""
    project_service = ProjectService(db)
    project = project_service.get_project(project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    return project

@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza um projeto existente"""
    project_service = ProjectService(db)
    project = project_service.update_project(project_id, project_data)

    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    return project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project_put(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza um projeto existente usando PUT"""
    project_service = ProjectService(db)
    project = project_service.update_project(project_id, project_data)

    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    return project

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove um projeto"""
    project_service = ProjectService(db)
    success = project_service.delete_project(project_id)

    if not success:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    return {"message": "Projeto removido com sucesso"}

# --- Tasks Endpoints ---

from ....schemas.project_task import ProjectTaskCreate, ProjectTaskUpdate, ProjectTaskResponse

@router.post("/{project_id}/tasks", response_model=ProjectTaskResponse)
def create_task(
    project_id: int,
    task_data: ProjectTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adiciona uma tarefa ao projeto"""
    project_service = ProjectService(db)
    task = project_service.create_task(project_id, task_data)
    if not task:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return task

@router.put("/{project_id}/tasks/{task_id}", response_model=ProjectTaskResponse)
def update_task(
    project_id: int,
    task_id: int,
    task_data: ProjectTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza uma tarefa do projeto"""
    project_service = ProjectService(db)
    task = project_service.update_task(task_id, task_data)
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    return task

@router.delete("/{project_id}/tasks/{task_id}")
def delete_task(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove uma tarefa do projeto"""
    project_service = ProjectService(db)
    success = project_service.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    return {"message": "Tarefa removida com sucesso"}

# --- Tags Endpoints ---

from ....schemas.tag import TagCreate, TagResponse

@router.post("/{project_id}/tags", response_model=TagResponse)
def add_tag(
    project_id: int,
    tag_data: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adiciona uma tag ao projeto"""
    project_service = ProjectService(db)
    tag = project_service.add_tag(project_id, tag_data)
    if not tag:
        raise HTTPException(status_code=404, detail="Não foi possível adicionar a tag")
    return tag

@router.delete("/{project_id}/tags/{tag_id}")
def remove_tag(
    project_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove uma tag do projeto"""
    project_service = ProjectService(db)
    success = project_service.remove_tag(project_id, tag_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tag não encontrada no projeto")
    return {"message": "Tag removida com sucesso"}

# --- Report Endpoints ---

from fastapi.responses import StreamingResponse
from ....services.project_report_service import ProjectReportService

@router.get("/{project_id}/report")
def get_project_report(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Retorna relatório completo do projeto em JSON"""
    report_service = ProjectReportService(db)
    report = report_service.get_project_report(project_id)

    if not report:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    return report

@router.get("/{project_id}/report/excel")
def export_project_report_excel(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Exporta relatório do projeto para Excel"""
    report_service = ProjectReportService(db)

    try:
        excel_buffer = report_service.export_to_excel(project_id)
    except ImportError as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not excel_buffer:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    # Get project name for filename
    report = report_service.get_project_report(project_id)
    project_name = report['projeto']['nome'].replace(' ', '_')[:30] if report else f"projeto_{project_id}"

    filename = f"relatorio_{project_name}.xlsx"

    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
