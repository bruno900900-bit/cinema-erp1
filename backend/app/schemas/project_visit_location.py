"""
Schemas Pydantic para locações visitadas em projetos.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from ..models.project_visit_location import VisitLocationStatus
from ..models.project_visit_workflow import WorkflowStageStatus


# ========== User Response (para evitar imports circulares) ==========

class UserBrief(BaseModel):
    """Resumo básico de usuário para respostas"""
    id: int
    name: str
    email: Optional[str] = None

    class Config:
        from_attributes = True


# ========== Workflow Stages ==========

class WorkflowStageBase(BaseModel):
    """Base para etapas de workflow"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    order_index: int = Field(default=0, ge=0)
    responsible_user_id: Optional[int] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None


class WorkflowStageCreate(WorkflowStageBase):
    """Schema para criar etapa de workflow"""
    visit_location_id: int


class WorkflowStageUpdate(BaseModel):
    """Schema para atualizar etapa de workflow"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    order_index: Optional[int] = Field(None, ge=0)
    status: Optional[WorkflowStageStatus] = None
    responsible_user_id: Optional[int] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None


class WorkflowStageResponse(WorkflowStageBase):
    """Schema de resposta para etapa de workflow"""
    id: int
    visit_location_id: int
    status: WorkflowStageStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completed_by_user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    # Relacionamentos
    responsible_user: Optional[UserBrief] = None
    completed_by_user: Optional[UserBrief] = None

    # Computed
    is_overdue: bool = False

    class Config:
        from_attributes = True


# ========== Photo Comments ==========

class PhotoCommentBase(BaseModel):
    """Base para comentários em fotos"""
    comment: str = Field(..., min_length=1)


class PhotoCommentCreate(PhotoCommentBase):
    """Schema para criar comentário"""
    photo_id: int
    user_id: int


class PhotoCommentResponse(PhotoCommentBase):
    """Schema de resposta para comentário"""
    id: int
    photo_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    # Relacionamento
    user: Optional[UserBrief] = None

    class Config:
        from_attributes = True


# ========== Visit Photos ==========

class VisitPhotoBase(BaseModel):
    """Base para fotos de visita"""
    caption: Optional[str] = None
    sort_order: int = 0


class VisitPhotoCreate(VisitPhotoBase):
    """Schema para criar foto"""
    visit_location_id: int
    filename: Optional[str] = None
    original_filename: Optional[str] = None
    file_path: Optional[str] = None
    url: Optional[str] = None
    uploaded_by_user_id: Optional[int] = None


class VisitPhotoResponse(VisitPhotoBase):
    """Schema de resposta para foto"""
    id: int
    visit_location_id: int
    filename: Optional[str] = None
    original_filename: Optional[str] = None
    file_path: Optional[str] = None
    url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_by_user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    # Relacionamentos
    uploaded_by_user: Optional[UserBrief] = None
    comments: List[PhotoCommentResponse] = []

    # Computed
    comments_count: int = 0

    class Config:
        from_attributes = True


# ========== Visit Locations ==========

class VisitLocationBase(BaseModel):
    """Base para locações visitadas"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    address: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    geo_coordinates: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    visit_date: Optional[date] = None
    next_visit_date: Optional[date] = None
    responsible_user_id: Optional[int] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    estimated_daily_rate: Optional[float] = Field(None, ge=0)
    estimated_total_cost: Optional[float] = Field(None, ge=0)
    currency: str = "BRL"
    cover_photo_url: Optional[str] = None


class VisitLocationCreate(VisitLocationBase):
    """Schema para criar locação visitada"""
    project_id: int
    status: VisitLocationStatus = VisitLocationStatus.VISITING


class VisitLocationUpdate(BaseModel):
    """Schema para atualizar locação visitada"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    address: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    geo_coordinates: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    status: Optional[VisitLocationStatus] = None
    visit_date: Optional[date] = None
    next_visit_date: Optional[date] = None
    responsible_user_id: Optional[int] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    estimated_daily_rate: Optional[float] = Field(None, ge=0)
    estimated_total_cost: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = None
    cover_photo_url: Optional[str] = None


class VisitLocationResponse(VisitLocationBase):
    """Schema de resposta para locação visitada"""
    id: int
    project_id: int
    status: VisitLocationStatus
    created_at: datetime
    updated_at: datetime

    # Relacionamentos
    responsible_user: Optional[UserBrief] = None
    photos: List[VisitPhotoResponse] = []
    workflow_stages: List[WorkflowStageResponse] = []

    # Computed
    photos_count: int = 0
    completed_stages_count: int = 0
    total_stages_count: int = 0
    workflow_progress: float = 0.0

    class Config:
        from_attributes = True


class VisitLocationBrief(BaseModel):
    """Resumo de locação visitada (para listagens)"""
    id: int
    project_id: int
    name: str
    city: Optional[str] = None
    state: Optional[str] = None
    status: VisitLocationStatus
    visit_date: Optional[date] = None
    rating: Optional[int] = None
    photos_count: int = 0
    workflow_progress: float = 0.0
    cover_photo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
