from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ProjectAccessLevel(str, Enum):
    VIEWER = "viewer"
    EDITOR = "editor"
    ADMIN = "admin"


class UserProjectBase(BaseModel):
    project_id: int
    access_level: ProjectAccessLevel = ProjectAccessLevel.VIEWER


class UserProjectCreate(UserProjectBase):
    pass


class UserProjectUpdate(BaseModel):
    access_level: Optional[ProjectAccessLevel] = None


class UserProjectResponse(UserProjectBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Dados do projeto expandidos
    project_name: Optional[str] = None
    project_status: Optional[str] = None

    class Config:
        from_attributes = True


class UserProjectListResponse(BaseModel):
    projects: List[UserProjectResponse]
    total: int


class BulkProjectAssignment(BaseModel):
    project_ids: List[int]
    access_level: ProjectAccessLevel = ProjectAccessLevel.VIEWER
