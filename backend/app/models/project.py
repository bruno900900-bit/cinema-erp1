from sqlalchemy import Column, String, Text, Boolean, Enum, Date, ForeignKey, Integer, JSON, Float, Computed
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class ProjectStatus(str, enum.Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    CANCELLED = "cancelled"

class Project(Base, TimestampMixin):
    __tablename__ = "projects"
    __table_args__ = {'extend_existing': True}

    # Informações básicas
    name = Column(String(255), nullable=False)  # Mantido para compatibilidade com banco
    title = Column(String(255), nullable=True)  # Adicionado para compatibilidade com frontend
    description = Column(Text, nullable=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.ACTIVE)

    # Cliente e orçamento
    client_name = Column(String(255), nullable=True)
    client_email = Column(String(255), nullable=True)
    client_phone = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    budget_total = Column(Float, nullable=False, default=0.0)  # Orçamento total aprovado
    budget = Column(Float, nullable=True, default=0.0)  # Adicionado para compatibilidade com frontend
    budget_spent = Column(Float, nullable=False, default=0.0)  # Valor já gasto
    # Em alguns dialects, marcar como persisted ajuda o ORM a tratar
    # corretamente como coluna gerada pelo servidor (não inserir valor).
    budget_remaining = Column(Float, Computed("budget_total - budget_spent", persisted=True))  # Saldo restante

    # Moeda e conversões
    budget_currency = Column(String(3), default="BRL")
    exchange_rate_usd = Column(Float, nullable=True)  # Taxa de câmbio para USD
    exchange_rate_eur = Column(Float, nullable=True)  # Taxa de câmbio para EUR

    # Datas
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    # Responsáveis
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Gerente do projeto
    coordinator_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Coordenador
    supervisor_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Supervisor
    responsibleUserId = Column(String(255), nullable=True)  # Adicionado para compatibilidade com frontend

    # Configurações
    is_public = Column(Boolean, default=False)
    settings_json = Column(JSON, nullable=True)  # Configurações específicas do projeto

    # Foto de capa
    cover_photo_url = Column(String(500), nullable=True)  # URL da foto de capa do projeto

    # Relacionamentos
    created_by_user = relationship("User", foreign_keys=[created_by])
    # Temporariamente comentado para compatibilidade
    # manager_user = relationship("User", back_populates="managed_projects", foreign_keys=[manager_id])
    # Temporariamente comentado para compatibilidade
    # coordinator_user = relationship("User", back_populates="coordinated_projects", foreign_keys=[coordinator_id])
    supervisor_user = relationship("User", foreign_keys=[supervisor_id])
    locations = relationship("Location", back_populates="project")
    project_locations = relationship("ProjectLocation", back_populates="project", cascade="all, delete-orphan")
    visits = relationship("Visit", back_populates="project")
    contracts = relationship("Contract", back_populates="project")
    financial_movements = relationship("FinancialMovement", back_populates="project")
    stages = relationship("ProjectStage", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("ProjectTask", back_populates="project", cascade="all, delete-orphan")
    project_tags = relationship("ProjectTag", back_populates="project", cascade="all, delete-orphan")
    visit_locations = relationship("ProjectVisitLocation", back_populates="project", cascade="all, delete-orphan")
    demands = relationship("LocationDemand", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', status='{self.status}', budget_remaining={self.budget_remaining})>"
