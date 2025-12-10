from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class FilterScope(str, Enum):
    PRIVATE = "private"
    TEAM = "team"
    PUBLIC = "public"

class CustomFilterBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Nome do filtro")
    description: Optional[str] = Field(None, description="Descrição do filtro")
    criteria_json: Dict[str, Any] = Field(..., description="Critérios do filtro")
    scope: FilterScope = Field(FilterScope.PRIVATE, description="Escopo do filtro")
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$', description="Cor do filtro em hex")
    icon: Optional[str] = Field(None, max_length=50, description="Ícone do filtro")
    is_default: bool = Field(False, description="Se é o filtro padrão")
    sort_order: int = Field(0, description="Ordem de exibição")

class CustomFilterCreate(CustomFilterBase):
    pass

class CustomFilterUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    criteria_json: Optional[Dict[str, Any]] = None
    scope: Optional[FilterScope] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = Field(None, max_length=50)
    is_default: Optional[bool] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class CustomFilterResponse(CustomFilterBase):
    id: int
    owner_user_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    criteria_summary: str = Field(..., description="Resumo dos critérios")

    class Config:
        from_attributes = True

class CustomFilterList(BaseModel):
    id: int
    name: str
    description: Optional[str]
    scope: FilterScope
    color: Optional[str]
    icon: Optional[str]
    is_default: bool
    sort_order: int
    is_active: bool
    created_at: datetime
    criteria_summary: str
    owner_name: str = Field(..., description="Nome do proprietário")

    class Config:
        from_attributes = True

# Schema para critérios de filtro
class FilterCriteria(BaseModel):
    """Schema para validação de critérios de filtro"""
    q: Optional[str] = Field(None, description="Busca textual")
    city: Optional[List[str]] = Field(None, description="Cidades")
    state: Optional[List[str]] = Field(None, description="Estados")
    space_type: Optional[List[str]] = Field(None, description="Tipos de espaço")
    status: Optional[List[str]] = Field(None, description="Status das locações")
    price_day: Optional[Dict[str, float]] = Field(None, description="Faixa de preço diário")
    price_hour: Optional[Dict[str, float]] = Field(None, description="Faixa de preço por hora")
    capacity: Optional[Dict[str, int]] = Field(None, description="Faixa de capacidade")
    area_size: Optional[Dict[str, float]] = Field(None, description="Faixa de área")
    tags: Optional[List[str]] = Field(None, description="Tags")
    supplier_ids: Optional[List[int]] = Field(None, description="IDs dos fornecedores")
    project_ids: Optional[List[int]] = Field(None, description="IDs dos projetos")
    responsible_user_ids: Optional[List[int]] = Field(None, description="IDs dos responsáveis")
    created_after: Optional[datetime] = Field(None, description="Criado após")
    created_before: Optional[datetime] = Field(None, description="Criado antes")
    geo_radius: Optional[Dict[str, Any]] = Field(None, description="Busca geográfica")

    class Config:
        schema_extra = {
            "example": {
                "q": "estúdio São Paulo",
                "city": ["São Paulo", "Rio de Janeiro"],
                "space_type": ["studio", "warehouse"],
                "price_day": {"min": 1000, "max": 5000},
                "capacity": {"min": 20, "max": 100},
                "tags": ["iluminação natural", "industrial"],
                "status": ["approved", "scheduled"]
            }
        }
