"""
Schemas Pydantic para Fotos de Locações do Projeto
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ========== User Brief ==========
class UserBrief(BaseModel):
    id: int
    full_name: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True


# ========== Photo Comment Schemas ==========
class PhotoCommentBase(BaseModel):
    comment: str


class PhotoCommentCreate(PhotoCommentBase):
    photo_id: int
    user_id: int


class PhotoCommentResponse(PhotoCommentBase):
    id: int
    photo_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    user: Optional[UserBrief] = None

    class Config:
        from_attributes = True


# ========== Project Location Photo Schemas ==========
class ProjectLocationPhotoBase(BaseModel):
    caption: Optional[str] = None
    category: Optional[str] = None
    sort_order: int = 0


class ProjectLocationPhotoCreate(ProjectLocationPhotoBase):
    project_location_id: int
    filename: Optional[str] = None
    original_filename: Optional[str] = None
    file_path: Optional[str] = None
    url: Optional[str] = None
    uploaded_by_user_id: Optional[int] = None


class ProjectLocationPhotoUpdate(BaseModel):
    caption: Optional[str] = None
    category: Optional[str] = None
    sort_order: Optional[int] = None


class ProjectLocationPhotoResponse(ProjectLocationPhotoBase):
    id: int
    project_location_id: int
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

    @property
    def comments_count(self) -> int:
        return len(self.comments)

    class Config:
        from_attributes = True


class ProjectLocationPhotoBrief(BaseModel):
    """Versão resumida para listagem"""
    id: int
    url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    category: Optional[str] = None
    comments_count: int = 0

    class Config:
        from_attributes = True
