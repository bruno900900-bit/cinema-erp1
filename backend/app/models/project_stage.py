from sqlalchemy import Column, String, Text, Boolean, Enum, Date, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class ProjectStageStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    CANCELLED = "cancelled"

class ProjectStageType(str, enum.Enum):
    PLANNING = "planning"
    PRE_PRODUCTION = "pre_production"
    PRODUCTION = "production"
    POST_PRODUCTION = "post_production"
    DELIVERY = "delivery"
    CUSTOM = "custom"

class ProjectStage(Base, TimestampMixin):
    __tablename__ = "project_stages"
    __table_args__ = {'extend_existing': True}

    # Informações básicas
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    stage_type = Column(Enum(ProjectStageType), nullable=False)
    status = Column(Enum(ProjectStageStatus), default=ProjectStageStatus.PENDING)

    # Ordem e sequência
    order_index = Column(Integer, nullable=False, default=0)
    is_sequential = Column(Boolean, default=True)  # Se deve aguardar etapa anterior

    # Datas
    planned_start_date = Column(Date, nullable=True)
    planned_end_date = Column(Date, nullable=True)
    actual_start_date = Column(Date, nullable=True)
    actual_end_date = Column(Date, nullable=True)

    # Orçamento da etapa
    budget_allocated = Column(Integer, nullable=True)  # Orçamento alocado para esta etapa
    budget_spent = Column(Integer, nullable=True, default=0)  # Valor gasto na etapa

    # Chaves estrangeiras
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Responsável principal
    coordinator_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Coordenador
    supervisor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Supervisor

    # Configurações
    settings_json = Column(JSON, nullable=True)  # Configurações específicas da etapa
    notes = Column(Text, nullable=True)  # Notas da etapa

    # Relacionamentos
    project = relationship("Project", back_populates="stages")
    responsible_user = relationship("User", foreign_keys=[responsible_user_id])
    coordinator_user = relationship("User", foreign_keys=[coordinator_user_id])
    supervisor_user = relationship("User", foreign_keys=[supervisor_user_id])
    tasks = relationship("StageTask", back_populates="stage", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ProjectStage(id={self.id}, name='{self.name}', stage_type='{self.stage_type}', status='{self.status}')>"

class StageTask(Base, TimestampMixin):
    __tablename__ = "stage_tasks"

    # Informações básicas
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(ProjectStageStatus), default=ProjectStageStatus.PENDING)
    priority = Column(String(20), default="medium")  # low, medium, high, urgent

    # Datas
    due_date = Column(Date, nullable=True)
    completed_at = Column(Date, nullable=True)

    # Chaves estrangeiras
    stage_id = Column(Integer, ForeignKey("project_stages.id"), nullable=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Configurações
    estimated_hours = Column(Integer, nullable=True)  # Horas estimadas
    actual_hours = Column(Integer, nullable=True)  # Horas reais trabalhadas
    notes = Column(Text, nullable=True)

    # Relacionamentos
    stage = relationship("ProjectStage", back_populates="tasks")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])
    created_by_user = relationship("User", foreign_keys=[created_by_user_id])

    def __repr__(self):
        return f"<StageTask(id={self.id}, title='{self.title}', status='{self.status}')>"
