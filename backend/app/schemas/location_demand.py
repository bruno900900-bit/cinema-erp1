from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models.location_demand import DemandPriority, DemandStatus


class LocationDemandBase(BaseModel):
    """Base schema for LocationDemand"""
    title: str = Field(..., min_length=1, max_length=255, description="Título da demanda")
    description: Optional[str] = Field(None, description="Descrição detalhada da demanda")
    priority: DemandPriority = Field(DemandPriority.MEDIUM, description="Prioridade da demanda")
    status: DemandStatus = Field(DemandStatus.PENDING, description="Status da demanda")
    category: Optional[str] = Field(None, max_length=100, description="Categoria da demanda")
    due_date: Optional[datetime] = Field(None, description="Data de vencimento")
    notes: Optional[str] = Field(None, description="Notas adicionais")
    attachments_json: Optional[List[str]] = Field(None, description="Lista de URLs de anexos")


class LocationDemandCreate(LocationDemandBase):
    """Schema for creating a new LocationDemand"""
    project_location_id: int = Field(..., description="ID da locação do projeto")
    project_id: int = Field(..., description="ID do projeto")
    assigned_user_id: Optional[int] = Field(None, description="ID do usuário responsável")
    # created_by_user_id será preenchido pelo backend


class LocationDemandUpdate(BaseModel):
    """Schema for updating a LocationDemand"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[DemandPriority] = None
    status: Optional[DemandStatus] = None
    category: Optional[str] = None
    assigned_user_id: Optional[int] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    attachments_json: Optional[List[str]] = None


class LocationDemandResponse(LocationDemandBase):
    """Schema for LocationDemand response"""
    id: int
    project_location_id: int
    project_id: int
    assigned_user_id: Optional[int] = None
    created_by_user_id: Optional[int] = None
    completed_at: Optional[datetime] = None
    agenda_event_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    # Campos computados
    is_overdue: Optional[bool] = None

    # Dados relacionados (opcionais - quando incluídos via join)
    assigned_user_name: Optional[str] = None
    created_by_user_name: Optional[str] = None
    location_name: Optional[str] = None

    class Config:
        from_attributes = True


class LocationDemandListResponse(BaseModel):
    """Schema for paginated list of demands"""
    demands: List[LocationDemandResponse]
    total: int
    page: int
    size: int
    total_pages: int


class LocationDemandFilter(BaseModel):
    """Schema for filtering demands"""
    project_id: Optional[int] = Field(None, description="Filtrar por projeto")
    project_location_id: Optional[int] = Field(None, description="Filtrar por locação")
    status: Optional[DemandStatus] = Field(None, description="Filtrar por status")
    priority: Optional[DemandPriority] = Field(None, description="Filtrar por prioridade")
    assigned_user_id: Optional[int] = Field(None, description="Filtrar por responsável")
    category: Optional[str] = Field(None, description="Filtrar por categoria")
    overdue_only: bool = Field(False, description="Mostrar apenas atrasadas")
    due_date_from: Optional[datetime] = Field(None, description="Vencimento a partir de")
    due_date_to: Optional[datetime] = Field(None, description="Vencimento até")


class LocationDemandSummary(BaseModel):
    """Summary of demands for a location or project"""
    total: int = 0
    pending: int = 0
    in_progress: int = 0
    completed: int = 0
    overdue: int = 0
    by_priority: Dict[str, int] = Field(default_factory=dict)
