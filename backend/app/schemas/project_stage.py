"""
Schemas Pydantic para Etapas do Projeto (Project Stages)
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


# Enums
class ProjectStageTypeEnum(str, Enum):
    planning = "planning"
    pre_production = "pre_production"
    location_search = "location_search"
    location_approval = "location_approval"
    technical_visit = "technical_visit"
    preparation = "preparation"
    production = "production"
    post_production = "post_production"
    delivery = "delivery"
    custom = "custom"


class ProjectStageStatusEnum(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    on_hold = "on_hold"
    cancelled = "cancelled"


# ========== User Brief ==========
class UserBrief(BaseModel):
    id: int
    full_name: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True


# ========== Stage Task Schemas ==========
class StageTaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: ProjectStageStatusEnum = ProjectStageStatusEnum.pending
    priority: str = "medium"
    due_date: Optional[date] = None
    estimated_hours: Optional[int] = None


class StageTaskCreate(StageTaskBase):
    stage_id: int
    created_by_user_id: int


class StageTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStageStatusEnum] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None
    estimated_hours: Optional[int] = None
    assigned_user_id: Optional[int] = None
    actual_hours: Optional[int] = None
    notes: Optional[str] = None


class StageTaskResponse(StageTaskBase):
    id: int
    stage_id: int
    assigned_user_id: Optional[int] = None
    created_by_user_id: int
    actual_hours: Optional[int] = None
    completed_at: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    assigned_user: Optional[UserBrief] = None

    class Config:
        from_attributes = True


# ========== Project Stage Schemas ==========
class ProjectStageBase(BaseModel):
    name: str
    description: Optional[str] = None
    stage_type: ProjectStageTypeEnum
    order_index: int = 0
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    notes: Optional[str] = None


class ProjectStageCreate(ProjectStageBase):
    project_id: int
    responsible_user_id: Optional[int] = None
    coordinator_user_id: Optional[int] = None
    supervisor_user_id: Optional[int] = None


class ProjectStageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    stage_type: Optional[ProjectStageTypeEnum] = None
    status: Optional[ProjectStageStatusEnum] = None
    order_index: Optional[int] = None
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    responsible_user_id: Optional[int] = None
    coordinator_user_id: Optional[int] = None
    supervisor_user_id: Optional[int] = None
    budget_allocated: Optional[int] = None
    budget_spent: Optional[int] = None
    notes: Optional[str] = None


class ProjectStageResponse(ProjectStageBase):
    id: int
    project_id: int
    status: ProjectStageStatusEnum
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    budget_allocated: Optional[int] = None
    budget_spent: Optional[int] = None
    responsible_user_id: Optional[int] = None
    coordinator_user_id: Optional[int] = None
    supervisor_user_id: Optional[int] = None
    is_sequential: bool = True
    settings_json: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    # Relacionamentos
    responsible_user: Optional[UserBrief] = None
    coordinator_user: Optional[UserBrief] = None
    supervisor_user: Optional[UserBrief] = None
    tasks: List[StageTaskResponse] = []

    # Computed
    @property
    def tasks_count(self) -> int:
        return len(self.tasks)

    @property
    def completed_tasks_count(self) -> int:
        return len([t for t in self.tasks if t.status == ProjectStageStatusEnum.completed])

    @property
    def progress_percentage(self) -> float:
        if not self.tasks:
            return 100.0 if self.status == ProjectStageStatusEnum.completed else 0.0
        return (self.completed_tasks_count / len(self.tasks)) * 100

    class Config:
        from_attributes = True


class ProjectStageBrief(BaseModel):
    """Versão resumida para listagem"""
    id: int
    project_id: int
    name: str
    stage_type: ProjectStageTypeEnum
    status: ProjectStageStatusEnum
    order_index: int
    planned_end_date: Optional[date] = None
    tasks_count: int = 0
    completed_tasks_count: int = 0

    class Config:
        from_attributes = True


# ========== Default Stages Creation ==========
DEFAULT_STAGES = [
    {"name": "Pré-Produção", "stage_type": ProjectStageTypeEnum.pre_production, "order_index": 0},
    {"name": "Busca de Locações", "stage_type": ProjectStageTypeEnum.location_search, "order_index": 1},
    {"name": "Aprovação de Locações", "stage_type": ProjectStageTypeEnum.location_approval, "order_index": 2},
    {"name": "Visita Técnica", "stage_type": ProjectStageTypeEnum.technical_visit, "order_index": 3},
    {"name": "Preparação", "stage_type": ProjectStageTypeEnum.preparation, "order_index": 4},
    {"name": "Filmagem", "stage_type": ProjectStageTypeEnum.production, "order_index": 5},
    {"name": "Pós-Produção", "stage_type": ProjectStageTypeEnum.post_production, "order_index": 6},
    {"name": "Entrega Final", "stage_type": ProjectStageTypeEnum.delivery, "order_index": 7},
]
