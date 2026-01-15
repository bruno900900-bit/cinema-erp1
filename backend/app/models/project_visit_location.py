"""
Modelo para locações sendo visitadas em projetos.
Diferente de Location, estas são locações em prospecção/visitação
que não precisam ser cadastradas formalmente no sistema.
"""
from sqlalchemy import Column, String, Text, Date, DateTime, ForeignKey, Enum, Integer, Float, JSON
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum


class VisitLocationStatus(str, enum.Enum):
    """Status da locação visitada"""
    VISITING = "visiting"              # Em visitação
    PENDING = "pending"                # Aguardando decisão
    APPROVED = "approved"              # Aprovada
    REJECTED = "rejected"              # Rejeitada
    ON_HOLD = "on_hold"               # Em espera


class ProjectVisitLocation(Base, TimestampMixin):
    """
    Locação sendo visitada em um projeto.
    Representa um local em prospecção sem necessidade de cadastro formal.
    """
    __tablename__ = "project_visit_locations"
    __table_args__ = {'extend_existing': True}

    # Relacionamento com projeto
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    # Informações básicas da locação
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Endereço
    address = Column(String(500), nullable=True)
    neighborhood = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    postal_code = Column(String(20), nullable=True)
    geo_coordinates = Column(String(100), nullable=True)  # "lat,lng"

    # Contato do local
    contact_name = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    contact_email = Column(String(255), nullable=True)

    # Status e datas
    status = Column(Enum(VisitLocationStatus), default=VisitLocationStatus.VISITING)
    visit_date = Column(Date, nullable=True)
    next_visit_date = Column(Date, nullable=True)

    # Responsável pela visita
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Avaliação e notas
    rating = Column(Integer, nullable=True)  # 1-5 estrelas
    notes = Column(Text, nullable=True)
    pros = Column(Text, nullable=True)  # Pontos positivos
    cons = Column(Text, nullable=True)  # Pontos negativos

    # Estimativas de custo
    estimated_daily_rate = Column(Float, nullable=True)
    estimated_total_cost = Column(Float, nullable=True)
    currency = Column(String(3), default="BRL")

    # Foto de capa
    cover_photo_url = Column(String(500), nullable=True)

    # Metadados adicionais (JSON para flexibilidade)
    metadata_json = Column(JSON, nullable=True)

    # Relacionamentos
    project = relationship("Project", back_populates="visit_locations")
    responsible_user = relationship("User", foreign_keys=[responsible_user_id])
    photos = relationship("ProjectVisitPhoto", back_populates="visit_location", cascade="all, delete-orphan")
    workflow_stages = relationship("ProjectVisitWorkflowStage", back_populates="visit_location", cascade="all, delete-orphan", order_by="ProjectVisitWorkflowStage.order_index")

    def __repr__(self):
        return f"<ProjectVisitLocation(id={self.id}, name='{self.name}', status='{self.status}')>"

    @property
    def photos_count(self) -> int:
        """Retorna o número de fotos"""
        return len(self.photos) if self.photos else 0

    @property
    def completed_stages_count(self) -> int:
        """Retorna o número de etapas concluídas"""
        if not self.workflow_stages:
            return 0
        return sum(1 for stage in self.workflow_stages if stage.status == "completed")

    @property
    def total_stages_count(self) -> int:
        """Retorna o número total de etapas"""
        return len(self.workflow_stages) if self.workflow_stages else 0

    @property
    def workflow_progress(self) -> float:
        """Retorna o progresso do workflow em porcentagem"""
        total = self.total_stages_count
        if total == 0:
            return 0.0
        return (self.completed_stages_count / total) * 100
