from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from ..models.project_location import RentalStatus

class ProjectLocationBase(BaseModel):
    project_id: int
    location_id: int
    rental_start: date
    rental_end: date
    rental_start_time: Optional[datetime] = None
    rental_end_time: Optional[datetime] = None
    daily_rate: float = Field(ge=0.0)
    hourly_rate: Optional[float] = Field(None, ge=0.0)
    total_cost: Optional[float] = Field(None, ge=0.0)
    currency: str = Field(default="BRL", max_length=3)
    status: RentalStatus = RentalStatus.RESERVED
    responsible_user_id: Optional[int] = None
    coordinator_user_id: Optional[int] = None
    notes: Optional[str] = None
    special_requirements: Optional[str] = None
    equipment_needed: Optional[str] = None
    contract_url: Optional[str] = None
    attachments_json: Optional[Dict[str, Any]] = None
    # Datas de Produção
    visit_date: Optional[date] = None
    technical_visit_date: Optional[date] = None
    filming_start_date: Optional[date] = None
    filming_end_date: Optional[date] = None
    delivery_date: Optional[date] = None

class ProjectLocationCreate(ProjectLocationBase):
    pass

class ProjectLocationUpdate(BaseModel):
    rental_start: Optional[date] = None
    rental_end: Optional[date] = None
    rental_start_time: Optional[datetime] = None
    rental_end_time: Optional[datetime] = None
    daily_rate: Optional[float] = Field(None, ge=0.0)
    hourly_rate: Optional[float] = Field(None, ge=0.0)
    total_cost: Optional[float] = Field(None, ge=0.0)
    currency: Optional[str] = Field(None, max_length=3)
    status: Optional[RentalStatus] = None
    responsible_user_id: Optional[int] = None
    coordinator_user_id: Optional[int] = None
    notes: Optional[str] = None
    special_requirements: Optional[str] = None
    equipment_needed: Optional[str] = None
    contract_url: Optional[str] = None
    attachments_json: Optional[Dict[str, Any]] = None
    # Datas de Produção
    visit_date: Optional[date] = None
    technical_visit_date: Optional[date] = None
    filming_start_date: Optional[date] = None
    filming_end_date: Optional[date] = None
    delivery_date: Optional[date] = None

from .project_location_stage import ProjectLocationStageResponse
from .location import LocationResponse
from .user import UserResponse

class ProjectLocationResponse(ProjectLocationBase):
    id: int
    completion_percentage: float
    duration_days: int
    is_active: bool
    is_overdue: bool
    created_at: datetime
    updated_at: datetime

    # Relacionamentos
    location: Optional[ LocationResponse] = None
    responsible_user: Optional[UserResponse] = None
    coordinator_user: Optional[UserResponse] = None
    stages: Optional[List[ProjectLocationStageResponse]] = None

    class Config:
        from_attributes = True

class ProjectLocationProgress(BaseModel):
    """Resumo do progresso de uma locação no projeto"""
    id: int
    location_title: str
    rental_start: date
    rental_end: date
    status: RentalStatus
    completion_percentage: float
    total_cost: float
    is_overdue: bool
    stages_completed: int
    stages_total: int
    next_milestone: Optional[str] = None

class ProjectLocationBulkUpdate(BaseModel):
    """Atualização em lote de locações"""
    location_ids: List[int]
    status: Optional[RentalStatus] = None
    responsible_user_id: Optional[int] = None
    notes: Optional[str] = None

class ProjectLocationFilter(BaseModel):
    """Filtros para busca de locações de projeto"""
    project_ids: Optional[List[int]] = None
    location_ids: Optional[List[int]] = None
    status: Optional[List[RentalStatus]] = None
    responsible_user_ids: Optional[List[int]] = None
    is_overdue: Optional[bool] = None
    is_active: Optional[bool] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    min_cost: Optional[float] = None
    max_cost: Optional[float] = None

    @validator('status', pre=True)
    def parse_status(cls, v):
        if isinstance(v, str):
            return [RentalStatus(x.strip()) for x in v.split(',')]
        return v

class ProjectLocationCostSummary(BaseModel):
    """Resumo de custos de locações em um projeto"""
    project_id: int
    total_locations: int
    total_cost: float
    average_daily_cost: float
    cost_by_status: Dict[str, float]
    cost_by_location: List[Dict[str, Any]]
    currency: str

class ProjectLocationTimeline(BaseModel):
    """Timeline de locações em um projeto"""
    project_id: int
    locations: List[Dict[str, Any]]
    milestones: List[Dict[str, Any]]
    critical_path: List[Dict[str, Any]]
