from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from ..models.tag import TagKind

class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Nome da tag")
    kind: TagKind = Field(..., description="Tipo da tag")
    description: Optional[str] = Field(None, description="Descrição da tag")
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$', description="Cor da tag em hexadecimal")

class TagCreate(TagBase):
    pass

class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    kind: Optional[TagKind] = None
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')

class TagResponse(TagBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TagStats(BaseModel):
    total_tags: int
    tags_by_kind: dict
    most_used_tags: List[dict]
    recent_tags: List[TagResponse]

class LocationTagCreate(BaseModel):
    location_id: int
    tag_id: int

class LocationTagResponse(BaseModel):
    id: int
    location_id: int
    tag_id: int
    tag: TagResponse
    created_at: datetime

    class Config:
        from_attributes = True
