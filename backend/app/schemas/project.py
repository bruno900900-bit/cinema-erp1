from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from ..models.project import ProjectStatus
from .project_task import ProjectTaskResponse
from .tag import TagResponse

class ProjectBase(BaseModel):
    title: str  # Mudado de 'name' para 'title' para compatibilidade com frontend
    description: Optional[str] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    notes: Optional[str] = None
    budget: Optional[float] = None  # Mudado de str para float
    budget_spent: Optional[float] = 0.0
    budget_remaining: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    responsibleUserId: Optional[str] = None  # Adicionado para compatibilidade
    cover_photo_url: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None  # Mudado de 'name' para 'title'
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    notes: Optional[str] = None
    budget: Optional[float] = None  # Mudado de str para float
    budget_spent: Optional[float] = None
    budget_remaining: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    responsibleUserId: Optional[str] = None
    cover_photo_url: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    status: ProjectStatus
    tasks: Optional[List[ProjectTaskResponse]] = []
    tags: Optional[List[TagResponse]] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        """Mapear campos do banco para o formato do frontend"""
        data = {
            'id': obj.id,
            'title': obj.name,  # Mapear name para title
            'description': obj.description,
            'client_name': obj.client_name,
            'client_email': obj.client_email,
            'client_phone': obj.client_phone,
            'notes': obj.notes,
            'budget': obj.budget_total,  # Mapear budget_total para budget
            'budget_spent': obj.budget_spent,
            'budget_remaining': obj.budget_remaining,
            'start_date': obj.start_date,
            'end_date': obj.end_date,
            'responsibleUserId': obj.responsibleUserId,
            'cover_photo_url': obj.cover_photo_url,
            'status': obj.status,
            'tasks': obj.tasks,
            'tags': [pt.tag for pt in obj.project_tags] if hasattr(obj, 'project_tags') else [],
            'created_at': obj.created_at,
            'updated_at': obj.updated_at,
        }
        return cls(**data)
