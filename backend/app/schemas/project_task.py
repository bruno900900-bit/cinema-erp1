from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from ..models.project_task import TaskStatus, TaskType

class ProjectTaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    type: TaskType = Field(default=TaskType.PREPARATION)
    status: TaskStatus = Field(default=TaskStatus.PENDING)
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

class ProjectTaskCreate(ProjectTaskBase):
    pass

class ProjectTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[TaskType] = None
    status: Optional[TaskStatus] = None
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None

class ProjectTaskResponse(ProjectTaskBase):
    id: int
    project_id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
