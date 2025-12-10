from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
from .tag import TagResponse

class LocationStatus(str, Enum):
    DRAFT = "draft"
    PROSPECTING = "prospecting"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    ARCHIVED = "archived"

class SpaceType(str, Enum):
    STUDIO = "studio"
    HOUSE = "house"
    WAREHOUSE = "warehouse"
    OFFICE = "office"
    OUTDOOR = "outdoor"
    CUSTOM = "custom"

class SectorType(str, Enum):
    CINEMA = "cinema"
    PUBLICIDADE = "publicidade"

class LocationBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Título da locação")
    slug: Optional[str] = Field(None, description="Slug único da locação (gerado automaticamente se não fornecido)")
    summary: Optional[str] = Field(None, description="Resumo da locação")
    description: Optional[str] = Field(None, description="Descrição detalhada")
    status: LocationStatus = Field(LocationStatus.DRAFT, description="Status da locação")
    sector_type: Optional[SectorType] = Field(None, description="Tipo de setor")
    supplier_id: Optional[int] = Field(None, description="ID do fornecedor")

    # Preços por setor
    price_day_cinema: Optional[float] = Field(None, description="Preço diário para cinema")
    price_hour_cinema: Optional[float] = Field(None, description="Preço por hora para cinema")
    price_day_publicidade: Optional[float] = Field(None, description="Preço diário para publicidade")
    price_hour_publicidade: Optional[float] = Field(None, description="Preço por hora para publicidade")
    currency: str = Field("BRL", description="Moeda")

    # Endereço detalhado
    street: Optional[str] = Field(None, max_length=255, description="Rua/Logradouro")
    number: Optional[str] = Field(None, max_length=20, description="Número")
    complement: Optional[str] = Field(None, max_length=100, description="Complemento")
    neighborhood: Optional[str] = Field(None, max_length=100, description="Bairro")
    city: Optional[str] = Field(None, max_length=100, description="Cidade")
    state: Optional[str] = Field(None, max_length=50, description="Estado")
    country: str = Field("Brasil", max_length=100, description="País")
    postal_code: Optional[str] = Field(None, max_length=20, description="CEP")

    # Informações de contato do fornecedor
    supplier_name: Optional[str] = Field(None, max_length=255, description="Nome do fornecedor")
    supplier_phone: Optional[str] = Field(None, max_length=50, description="Telefone do fornecedor")
    supplier_email: Optional[str] = Field(None, max_length=255, description="Email do fornecedor")
    contact_person: Optional[str] = Field(None, max_length=255, description="Pessoa de contato")
    contact_phone: Optional[str] = Field(None, max_length=50, description="Telefone de contato")
    contact_email: Optional[str] = Field(None, max_length=255, description="Email de contato")

    # Características físicas
    space_type: Optional[SpaceType] = Field(None, description="Tipo de espaço")
    capacity: Optional[int] = Field(None, description="Capacidade em pessoas")
    area_size: Optional[float] = Field(None, description="Área em m²")
    power_specs: Optional[str] = Field(None, description="Especificações de energia")
    noise_level: Optional[str] = Field(None, max_length=50, description="Nível de ruído")
    acoustic_treatment: Optional[str] = Field(None, description="Tratamento acústico")
    parking_spots: Optional[int] = Field(None, description="Vagas de estacionamento")
    accessibility_features: Optional[Dict[str, Any]] = Field(None, description="Recursos de acessibilidade")

    # Relacionamentos
    project_id: Optional[int] = Field(None, description="ID do projeto")
    supplier_id: Optional[int] = Field(None, description="ID do fornecedor")
    responsible_user_id: Optional[int] = Field(None, description="ID do usuário responsável")

    # Foto de capa
    cover_photo_url: Optional[str] = Field(None, description="URL da foto de capa da locação")

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None
    status: Optional[LocationStatus] = None
    sector_type: Optional[SectorType] = None

    # Preços
    price_day_cinema: Optional[float] = None
    price_hour_cinema: Optional[float] = None
    price_day_publicidade: Optional[float] = None
    price_hour_publicidade: Optional[float] = None
    currency: Optional[str] = None

    # Endereço
    street: Optional[str] = None
    number: Optional[str] = None
    complement: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None

    # Contato
    supplier_name: Optional[str] = None
    supplier_phone: Optional[str] = None
    supplier_email: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None

    # Características
    space_type: Optional[SpaceType] = None
    capacity: Optional[int] = None
    area_size: Optional[float] = None
    power_specs: Optional[str] = None
    noise_level: Optional[str] = None
    acoustic_treatment: Optional[str] = None
    parking_spots: Optional[int] = None
    accessibility_features: Optional[Dict[str, Any]] = None

    # Relacionamentos
    project_id: Optional[int] = None
    supplier_id: Optional[int] = None
    responsible_user_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None

class LocationPhotoResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    is_primary: bool = False
    file_size: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LocationResponse(LocationBase):
    id: int
    slug: str
    created_at: datetime
    updated_at: datetime

    # Campos calculados
    full_address: Optional[str] = Field(None, description="Endereço completo formatado")
    price_by_sector: Optional[Dict[str, float]] = Field(None, description="Preços por setor")

    # Fotos da localização
    photos: Optional[List[LocationPhotoResponse]] = Field(None, description="Fotos da localização")
    tags: Optional[List[TagResponse]] = Field(None, description="Tags associadas à locação")

    class Config:
        from_attributes = True
