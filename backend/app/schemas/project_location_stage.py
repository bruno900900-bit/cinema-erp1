from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models.project_location_stage import LocationStageType, StageStatus
from .user import UserResponse

class ProjectLocationStageBase(BaseModel):
    stage_type: LocationStageType
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    planned_start_date: Optional[datetime] = None
    planned_end_date: Optional[datetime] = None
    responsible_user_id: Optional[int] = None
    coordinator_user_id: Optional[int] = None
    weight: float = Field(default=1.0, ge=0.0, le=10.0)
    is_milestone: bool = False
    is_critical: bool = False
    notes: Optional[str] = None
    attachments_json: Optional[Dict[str, Any]] = None
    dependencies_json: Optional[List[int]] = None

class ProjectLocationStageCreate(ProjectLocationStageBase):
    project_location_id: int

class ProjectLocationStageUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[StageStatus] = None
    completion_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    planned_start_date: Optional[datetime] = None
    planned_end_date: Optional[datetime] = None
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    responsible_user_id: Optional[int] = None
    coordinator_user_id: Optional[int] = None
    weight: Optional[float] = Field(None, ge=0.0, le=10.0)
    is_milestone: Optional[bool] = None
    is_critical: Optional[bool] = None
    notes: Optional[str] = None
    attachments_json: Optional[Dict[str, Any]] = None
    dependencies_json: Optional[List[int]] = None
    modified_by_user_id: Optional[int] = Field(None, description="ID do usuário que fez a alteração")

class ProjectLocationStageResponse(ProjectLocationStageBase):
    id: int
    project_location_id: int
    status: StageStatus
    completion_percentage: float
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    is_overdue: bool
    is_delayed: bool
    created_at: datetime
    updated_at: datetime

    # Relacionamentos
    responsible_user: Optional[UserResponse] = None
    coordinator_user: Optional[UserResponse] = None

    # Audit trail
    status_changed_at: Optional[datetime] = None
    status_changed_by_user: Optional[UserResponse] = None
    completion_changed_at: Optional[datetime] = None
    completion_changed_by_user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class ProjectLocationStageProgress(BaseModel):
    """Resumo do progresso de uma etapa"""
    id: int
    title: str
    stage_type: LocationStageType
    status: StageStatus
    completion_percentage: float
    is_overdue: bool
    is_critical: bool
    planned_end_date: Optional[datetime] = None
    responsible_user_name: Optional[str] = None

class ProjectLocationStageBulkUpdate(BaseModel):
    """Atualização em lote de etapas"""
    stage_ids: List[int]
    status: Optional[StageStatus] = None
    completion_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    responsible_user_id: Optional[int] = None
    notes: Optional[str] = None

class ProjectLocationStageTemplate(BaseModel):
    """Template para criação automática de etapas"""
    stage_type: LocationStageType
    title: str
    description: str
    default_duration_days: int = 1
    weight: float = 1.0
    is_milestone: bool = False
    is_critical: bool = False
    default_responsible_role: Optional[str] = None  # Ex: "coordinator", "manager"

class ProjectLocationStageFilter(BaseModel):
    """Filtros para busca de etapas"""
    project_location_ids: Optional[List[int]] = None
    stage_types: Optional[List[LocationStageType]] = None
    status: Optional[List[StageStatus]] = None
    responsible_user_ids: Optional[List[int]] = None
    is_overdue: Optional[bool] = None
    is_critical: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

    @validator('stage_types', pre=True)
    def parse_stage_types(cls, v):
        if isinstance(v, str):
            return [LocationStageType(x.strip()) for x in v.split(',')]
        return v

    @validator('status', pre=True)
    def parse_status(cls, v):
        if isinstance(v, str):
            return [StageStatus(x.strip()) for x in v.split(',')]
        return v

class ProjectLocationStagesSummary(BaseModel):
    """Resumo das etapas de locações em um projeto"""
    project_id: int
    total_stages: int
    completed_stages: int
    in_progress_stages: int
    pending_stages: int
    overdue_stages: int
    completion_percentage: float
    stages_by_status: Dict[str, int]
    stages_by_type: Dict[str, int]
    critical_stages_count: int
    milestones_count: int

class StageStatusUpdate(BaseModel):
    """Schema para atualização de status de uma etapa"""
    status: StageStatus
    notes: Optional[str] = Field(None, max_length=1000)

class StageHistoryResponse(BaseModel):
    """Schema para resposta de histórico de mudanças"""
    id: int
    stage_id: int
    previous_status: Optional[StageStatus] = None
    new_status: StageStatus
    previous_completion: Optional[float] = None
    new_completion: float
    changed_by_user_id: int
    changed_by: UserResponse
    change_notes: Optional[str] = None
    changed_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
