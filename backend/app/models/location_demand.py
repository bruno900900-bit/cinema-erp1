from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, Integer, JSON
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum


class DemandPriority(str, enum.Enum):
    """Prioridade da demanda"""
    LOW = "low"           # Baixa
    MEDIUM = "medium"     # Média
    HIGH = "high"         # Alta
    URGENT = "urgent"     # Urgente


class DemandStatus(str, enum.Enum):
    """Status da demanda"""
    PENDING = "pending"           # Pendente
    IN_PROGRESS = "in_progress"   # Em andamento
    COMPLETED = "completed"       # Concluída
    CANCELLED = "cancelled"       # Cancelada
    ON_HOLD = "on_hold"          # Em espera


class LocationDemand(Base, TimestampMixin):
    """
    Demandas associadas a uma locação de projeto.
    Substitui o sistema fixo de etapas por demandas flexíveis.
    """
    __tablename__ = "location_demands"
    __table_args__ = {'extend_existing': True}

    # Relacionamentos principais
    project_location_id = Column(Integer, ForeignKey("project_locations.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    # Dados da demanda
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Enum(DemandPriority), default=DemandPriority.MEDIUM, nullable=False)
    status = Column(Enum(DemandStatus), default=DemandStatus.PENDING, nullable=False)

    # Categorização
    category = Column(String(100), nullable=True)  # Ex: "Elétrica", "Cenografia", "Jurídico"

    # Responsáveis
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Datas
    due_date = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Integração com agenda
    agenda_event_id = Column(Integer, ForeignKey("agenda_events.id", ondelete="SET NULL"), nullable=True)

    # Notas e anexos
    notes = Column(Text, nullable=True)
    attachments_json = Column(JSON, nullable=True)  # Lista de URLs de anexos

    # Relacionamentos
    project_location = relationship("ProjectLocation", back_populates="demands")
    project = relationship("Project", back_populates="demands")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])
    created_by_user = relationship("User", foreign_keys=[created_by_user_id])
    agenda_event = relationship("AgendaEvent")

    def __repr__(self):
        return f"<LocationDemand(id={self.id}, title='{self.title}', priority='{self.priority}', status='{self.status}')>"

    @property
    def is_overdue(self) -> bool:
        """Verifica se a demanda está atrasada"""
        if not self.due_date or self.status == DemandStatus.COMPLETED:
            return False
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        due = self.due_date
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)
        return now > due

    @property
    def priority_order(self) -> int:
        """Retorna ordem numérica para ordenação por prioridade"""
        order = {
            DemandPriority.URGENT: 0,
            DemandPriority.HIGH: 1,
            DemandPriority.MEDIUM: 2,
            DemandPriority.LOW: 3,
        }
        return order.get(self.priority, 2)
