from sqlalchemy import Column, String, Text, Boolean, Enum, Integer, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class LocationStatus(str, enum.Enum):
    DRAFT = "draft"
    PROSPECTING = "prospecting"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class SpaceType(str, enum.Enum):
    STUDIO = "studio"
    HOUSE = "house"
    WAREHOUSE = "warehouse"
    OFFICE = "office"
    OUTDOOR = "outdoor"
    CUSTOM = "custom"

class SectorType(str, enum.Enum):
    CINEMA = "cinema"
    PUBLICIDADE = "publicidade"

class Location(Base, TimestampMixin):
    __tablename__ = "locations"
    __table_args__ = {'extend_existing': True}

    # Informações básicas
    title = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True)
    summary = Column(Text, nullable=True)
    description = Column(Text, nullable=True)

    # Status e projeto
    status = Column(Enum(LocationStatus), default=LocationStatus.DRAFT)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)  # Nullable enquanto prospecting
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)

    # Responsáveis
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Responsável principal
    coordinator_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Coordenador
    supervisor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Supervisor

    # Tipo de setor
    sector_type = Column(Enum(SectorType), nullable=True)  # cinema ou publicidade

    # Preços diferenciados por setor
    # Cinema
    price_day_cinema = Column(Float, nullable=True)
    price_hour_cinema = Column(Float, nullable=True)

    # Publicidade
    price_day_publicidade = Column(Float, nullable=True)
    price_hour_publicidade = Column(Float, nullable=True)

    # Moeda padrão
    currency = Column(String(3), default="BRL")

    # Endereço e localização
    address_json = Column(JSON, nullable=True)  # Endereço estruturado
    street = Column(String(255), nullable=True)  # Rua/Logradouro
    number = Column(String(20), nullable=True)  # Número
    complement = Column(String(100), nullable=True)  # Complemento
    neighborhood = Column(String(100), nullable=True)  # Bairro
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    country = Column(String(100), default="Brasil")
    postal_code = Column(String(20), nullable=True)

    # Informações de contato do fornecedor
    supplier_name = Column(String(255), nullable=True)  # Nome do fornecedor
    supplier_phone = Column(String(50), nullable=True)  # Telefone do fornecedor
    supplier_email = Column(String(255), nullable=True)  # Email do fornecedor
    contact_person = Column(String(255), nullable=True)  # Pessoa de contato
    contact_phone = Column(String(50), nullable=True)  # Telefone de contato
    contact_email = Column(String(255), nullable=True)  # Email de contato

    # Geolocalização (PostGIS)
    geo_point = Column(String(100), nullable=True)  # 'POINT(lat lng)' ou coordenadas

    # Características físicas
    space_type = Column(Enum(SpaceType), nullable=True)
    capacity = Column(Integer, nullable=True)  # Capacidade em pessoas
    area_size = Column(Float, nullable=True)  # em m²
    power_specs = Column(Text, nullable=True)  # Especificações de energia
    noise_level = Column(String(50), nullable=True)  # Nível de ruído
    acoustic_treatment = Column(Text, nullable=True)  # Tratamento acústico
    parking_spots = Column(Integer, nullable=True)  # Vagas de estacionamento
    accessibility_features = Column(JSON, nullable=True)  # Recursos de acessibilidade

    # Disponibilidade
    availability_json = Column(JSON, nullable=True)  # Janelas de datas disponíveis

    # Busca e SEO
    search_vector = Column(Text, nullable=True)  # tsvector para FTS
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)

    # Foto de capa
    cover_photo_url = Column(String(500), nullable=True)  # URL da foto de capa da locação

    # Relacionamentos
    project = relationship("Project", back_populates="locations")
    project_locations = relationship("ProjectLocation", back_populates="location", cascade="all, delete-orphan")
    supplier = relationship("Supplier", back_populates="locations")
    # Temporariamente comentado para compatibilidade
    # responsible_user = relationship("User", back_populates="responsible_locations", foreign_keys=[responsible_user_id])
    coordinator_user = relationship("User", foreign_keys=[coordinator_user_id])
    supervisor_user = relationship("User", foreign_keys=[supervisor_user_id])
    photos = relationship("LocationPhoto", back_populates="location", cascade="all, delete-orphan")
    location_tags = relationship("LocationTag", back_populates="location", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="location")
    presentation_items = relationship("PresentationItem", back_populates="location")
    visits = relationship("Visit", back_populates="location")
    financial_movements = relationship("FinancialMovement", back_populates="location")

    def __repr__(self):
        return f"<Location(id={self.id}, title='{self.title}', status='{self.status}', city='{self.city}')>"

    def get_price_by_sector(self, sector: SectorType, price_type: str = "day") -> float:
        """Retorna o preço baseado no setor e tipo (dia/hora)"""
        if sector == SectorType.CINEMA:
            return self.price_day_cinema if price_type == "day" else self.price_hour_cinema
        elif sector == SectorType.PUBLICIDADE:
            return self.price_day_publicidade if price_type == "day" else self.price_hour_publicidade
        return None
