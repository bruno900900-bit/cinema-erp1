from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime

class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Nome do fornecedor")
    tax_id: Optional[str] = Field(None, max_length=20, description="CNPJ/CPF do fornecedor")
    email: Optional[EmailStr] = Field(None, description="Email de contato")
    phone: Optional[str] = Field(None, max_length=50, description="Telefone de contato")
    website: Optional[str] = Field(None, max_length=255, description="Website do fornecedor")
    address_json: Optional[Dict[str, Any]] = Field(None, description="Endereço estruturado")
    notes: Optional[str] = Field(None, description="Notas sobre o fornecedor")
    rating: Optional[float] = Field(None, ge=1.0, le=5.0, description="Avaliação do fornecedor (1-5)")
    is_active: bool = Field(True, description="Se o fornecedor está ativo")

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    tax_id: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=255)
    address_json: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    is_active: Optional[bool] = None

class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime
    updated_at: datetime
    locations_count: Optional[int] = Field(None, description="Número de locações vinculadas")

    class Config:
        from_attributes = True

class SupplierListResponse(BaseModel):
    suppliers: List[SupplierResponse]
    total: int
    page: int
    size: int
    total_pages: int

class SupplierFilter(BaseModel):
    name: Optional[str] = None
    tax_id: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None
    rating_min: Optional[float] = None
    rating_max: Optional[float] = None
    has_locations: Optional[bool] = None
