from pydantic import BaseModel, validator, Field
from typing import Optional, List, Dict, Any
from datetime import date
from ..models.location import LocationStatus, SpaceType
from ..models.tag import TagKind

class PriceRange(BaseModel):
    min: Optional[float] = Field(None, ge=0)
    max: Optional[float] = Field(None, ge=0)
    
    @validator('max')
    def max_must_be_greater_than_min(cls, v, values):
        if v is not None and 'min' in values and values['min'] is not None:
            if v <= values['min']:
                raise ValueError('max deve ser maior que min')
        return v

class CapacityRange(BaseModel):
    min: Optional[int] = Field(None, ge=1)
    max: Optional[int] = Field(None, ge=1)
    
    @validator('max')
    def max_must_be_greater_than_min(cls, v, values):
        if v is not None and 'min' in values and values['min'] is not None:
            if v <= values['min']:
                raise ValueError('max deve ser maior que min')
        return v

class DateRange(BaseModel):
    from_date: Optional[date] = None
    to_date: Optional[date] = None
    
    @validator('to_date')
    def to_date_must_be_after_from_date(cls, v, values):
        if v is not None and 'from_date' in values and values['from_date'] is not None:
            if v <= values['from_date']:
                raise ValueError('to_date deve ser posterior a from_date')
        return v

class GeoSearch(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(..., gt=0, le=1000)

class SortField(BaseModel):
    field: str = Field(..., description="Campo para ordenação")
    direction: str = Field(..., description="Direção: asc ou desc")
    
    @validator('direction')
    def validate_direction(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('direction deve ser "asc" ou "desc"')
        return v

class LocationSearchRequest(BaseModel):
    # Busca textual
    q: Optional[str] = Field(None, max_length=500, description="Termo de busca geral")
    
    # Filtros por IDs
    project_ids: Optional[List[int]] = None
    supplier_ids: Optional[List[int]] = None
    responsible_user_ids: Optional[List[int]] = None
    
    # Filtros por status e tipo
    status: Optional[List[LocationStatus]] = None
    space_type: Optional[List[SpaceType]] = None
    
    # Filtros por tags
    tags: Optional[Dict[TagKind, List[str]]] = None
    
    # Filtros geográficos
    city: Optional[List[str]] = None
    state: Optional[List[str]] = None
    country: Optional[List[str]] = None
    
    # Filtros por preço e capacidade
    price_day: Optional[PriceRange] = None
    price_hour: Optional[PriceRange] = None
    capacity: Optional[CapacityRange] = None
    
    # Filtros por data
    date_range: Optional[DateRange] = None
    
    # Busca geográfica
    geo: Optional[GeoSearch] = None
    
    # Ordenação
    sort: Optional[List[SortField]] = Field(default=[{"field": "created_at", "direction": "desc"}])
    
    # Paginação
    page: int = Field(1, ge=1, description="Número da página")
    page_size: int = Field(24, ge=1, le=100, description="Itens por página")
    
    # Facetas e inclusões
    facets: bool = Field(True, description="Incluir facetas na resposta")
    include: Optional[List[str]] = Field(None, description="Relacionamentos a incluir")
    
    class Config:
        schema_extra = {
            "example": {
                "q": "galpão silencioso",
                "project_ids": [1, 2],
                "supplier_ids": [10],
                "responsible_user_ids": [5],
                "status": ["approved", "scheduled"],
                "space_type": ["warehouse", "studio"],
                "tags": {
                    "feature": ["iluminação natural", "industrial"],
                    "style": ["vintage", "moderno"]
                },
                "city": ["São Paulo"],
                "state": ["SP"],
                "country": ["BR"],
                "price_day": {"min": 500, "max": 5000},
                "capacity": {"min": 10, "max": 200},
                "date_range": {"from_date": "2025-09-10", "to_date": "2025-10-15"},
                "geo": {"lat": -23.561, "lng": -46.656, "radius_km": 15},
                "sort": [{"field": "score", "direction": "desc"}, {"field": "price_day", "direction": "asc"}],
                "page": 1,
                "page_size": 24,
                "facets": True,
                "include": ["photos", "supplier", "project", "tags"]
            }
        }

class LocationSearchResponse(BaseModel):
    locations: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int
    total_pages: int
    facets: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
