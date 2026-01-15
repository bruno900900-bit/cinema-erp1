"""
Service para gerenciar Etapas do Projeto (Project Stages)
"""
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timezone

from ..models.project_stage import ProjectStage, StageTask, ProjectStageStatus, ProjectStageType
from ..schemas.project_stage import (
    ProjectStageCreate,
    ProjectStageUpdate,
    StageTaskCreate,
    StageTaskUpdate,
    DEFAULT_STAGES,
)


class ProjectStageService:
    """Service para operações CRUD de etapas do projeto"""

    def __init__(self, db: Session):
        self.db = db

    # ========== Project Stages ==========

    def create_stage(self, data: ProjectStageCreate) -> ProjectStage:
        """Cria uma nova etapa"""
        stage = ProjectStage(
            project_id=data.project_id,
            name=data.name,
            description=data.description,
            stage_type=ProjectStageType(data.stage_type.value),
            order_index=data.order_index,
            planned_start_date=data.planned_start_date,
            planned_end_date=data.planned_end_date,
            responsible_user_id=data.responsible_user_id,
            coordinator_user_id=data.coordinator_user_id,
            supervisor_user_id=data.supervisor_user_id,
            notes=data.notes,
        )
        self.db.add(stage)
        self.db.commit()
        self.db.refresh(stage)
        return stage

    def create_default_stages(self, project_id: int) -> List[ProjectStage]:
        """Cria as etapas padrão para um novo projeto"""
        stages = []
        for stage_data in DEFAULT_STAGES:
            stage = ProjectStage(
                project_id=project_id,
                name=stage_data["name"],
                stage_type=ProjectStageType(stage_data["stage_type"].value),
                order_index=stage_data["order_index"],
                status=ProjectStageStatus.PENDING,
            )
            self.db.add(stage)
            stages.append(stage)
        self.db.commit()
        for stage in stages:
            self.db.refresh(stage)
        return stages

    def get_stage(self, stage_id: int) -> Optional[ProjectStage]:
        """Obtém uma etapa por ID"""
        return (
            self.db.query(ProjectStage)
            .options(
                joinedload(ProjectStage.responsible_user),
                joinedload(ProjectStage.coordinator_user),
                joinedload(ProjectStage.supervisor_user),
                joinedload(ProjectStage.tasks).joinedload(StageTask.assigned_user),
            )
            .filter(ProjectStage.id == stage_id)
            .first()
        )

    def get_stages_by_project(self, project_id: int) -> List[ProjectStage]:
        """Lista etapas de um projeto ordenadas"""
        return (
            self.db.query(ProjectStage)
            .options(
                joinedload(ProjectStage.responsible_user),
                joinedload(ProjectStage.tasks),
            )
            .filter(ProjectStage.project_id == project_id)
            .order_by(ProjectStage.order_index)
            .all()
        )

    def update_stage(self, stage_id: int, data: ProjectStageUpdate) -> Optional[ProjectStage]:
        """Atualiza uma etapa"""
        stage = self.db.query(ProjectStage).filter(ProjectStage.id == stage_id).first()
        if not stage:
            return None

        update_data = data.model_dump(exclude_unset=True)

        # Tratar mudança de status
        if 'status' in update_data:
            new_status = ProjectStageStatus(update_data['status'].value)
            if new_status == ProjectStageStatus.IN_PROGRESS and stage.actual_start_date is None:
                stage.actual_start_date = datetime.now(timezone.utc).date()
            elif new_status == ProjectStageStatus.COMPLETED and stage.actual_end_date is None:
                stage.actual_end_date = datetime.now(timezone.utc).date()
            update_data['status'] = new_status

        for field, value in update_data.items():
            if field == 'stage_type' and value:
                value = ProjectStageType(value.value)
            setattr(stage, field, value)

        self.db.commit()
        self.db.refresh(stage)
        return stage

    def delete_stage(self, stage_id: int) -> bool:
        """Remove uma etapa"""
        stage = self.db.query(ProjectStage).filter(ProjectStage.id == stage_id).first()
        if not stage:
            return False
        self.db.delete(stage)
        self.db.commit()
        return True

    def reorder_stages(self, project_id: int, stage_ids: List[int]) -> List[ProjectStage]:
        """Reordena etapas"""
        for index, stage_id in enumerate(stage_ids):
            stage = self.db.query(ProjectStage).filter(
                ProjectStage.id == stage_id,
                ProjectStage.project_id == project_id
            ).first()
            if stage:
                stage.order_index = index
        self.db.commit()
        return self.get_stages_by_project(project_id)

    # ========== Stage Tasks ==========

    def create_task(self, data: StageTaskCreate) -> StageTask:
        """Cria uma tarefa em uma etapa"""
        task = StageTask(
            stage_id=data.stage_id,
            title=data.title,
            description=data.description,
            status=ProjectStageStatus(data.status.value),
            priority=data.priority,
            due_date=data.due_date,
            estimated_hours=data.estimated_hours,
            created_by_user_id=data.created_by_user_id,
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def get_task(self, task_id: int) -> Optional[StageTask]:
        """Obtém uma tarefa por ID"""
        return (
            self.db.query(StageTask)
            .options(
                joinedload(StageTask.assigned_user),
                joinedload(StageTask.created_by_user),
            )
            .filter(StageTask.id == task_id)
            .first()
        )

    def get_tasks_by_stage(self, stage_id: int) -> List[StageTask]:
        """Lista tarefas de uma etapa"""
        return (
            self.db.query(StageTask)
            .options(joinedload(StageTask.assigned_user))
            .filter(StageTask.stage_id == stage_id)
            .order_by(StageTask.id)
            .all()
        )

    def update_task(self, task_id: int, data: StageTaskUpdate) -> Optional[StageTask]:
        """Atualiza uma tarefa"""
        task = self.db.query(StageTask).filter(StageTask.id == task_id).first()
        if not task:
            return None

        update_data = data.model_dump(exclude_unset=True)

        # Tratar mudança de status
        if 'status' in update_data:
            new_status = ProjectStageStatus(update_data['status'].value)
            if new_status == ProjectStageStatus.COMPLETED and task.completed_at is None:
                task.completed_at = datetime.now(timezone.utc).date()
            update_data['status'] = new_status

        for field, value in update_data.items():
            setattr(task, field, value)

        self.db.commit()
        self.db.refresh(task)
        return task

    def delete_task(self, task_id: int) -> bool:
        """Remove uma tarefa"""
        task = self.db.query(StageTask).filter(StageTask.id == task_id).first()
        if not task:
            return False
        self.db.delete(task)
        self.db.commit()
        return True

    def complete_task(self, task_id: int) -> Optional[StageTask]:
        """Marca uma tarefa como concluída"""
        task = self.db.query(StageTask).filter(StageTask.id == task_id).first()
        if not task:
            return None
        task.status = ProjectStageStatus.COMPLETED
        task.completed_at = datetime.now(timezone.utc).date()
        self.db.commit()
        self.db.refresh(task)
        return task
