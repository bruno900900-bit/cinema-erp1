"""
Modelo para workflow de locações visitadas.
Permite criar etapas personalizáveis com responsáveis.
"""
from sqlalchemy import Column, String, Text, Date, DateTime, ForeignKey, Enum, Integer
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum


class WorkflowStageStatus(str, enum.Enum):
    """Status de uma etapa do workflow"""
    PENDING = "pending"              # Aguardando início
    IN_PROGRESS = "in_progress"      # Em andamento
    COMPLETED = "completed"          # Concluída
    SKIPPED = "skipped"              # Pulada
    BLOCKED = "blocked"              # Bloqueada


class ProjectVisitWorkflowStage(Base, TimestampMixin):
    """
    Etapa de workflow para uma locação visitada.
    O usuário pode criar etapas personalizadas.
    """
    __tablename__ = "project_visit_workflow_stages"
    __table_args__ = {'extend_existing': True}

    # Relacionamento com a locação visitada
    visit_location_id = Column(Integer, ForeignKey("project_visit_locations.id"), nullable=False)

    # Informações da etapa
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Ordenação
    order_index = Column(Integer, default=0)

    # Status
    status = Column(Enum(WorkflowStageStatus), default=WorkflowStageStatus.PENDING)

    # Responsável
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Datas
    due_date = Column(Date, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Quem completou
    completed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Notas
    notes = Column(Text, nullable=True)

    # Relacionamentos
    visit_location = relationship("ProjectVisitLocation", back_populates="workflow_stages")
    responsible_user = relationship("User", foreign_keys=[responsible_user_id])
    completed_by_user = relationship("User", foreign_keys=[completed_by_user_id])

    def __repr__(self):
        return f"<ProjectVisitWorkflowStage(id={self.id}, title='{self.title}', status='{self.status}')>"

    @property
    def is_overdue(self) -> bool:
        """Verifica se a etapa está atrasada"""
        if not self.due_date or self.status == WorkflowStageStatus.COMPLETED:
            return False
        from datetime import date
        return date.today() > self.due_date

    def mark_completed(self, user_id: int):
        """Marca a etapa como concluída"""
        from datetime import datetime, timezone
        self.status = WorkflowStageStatus.COMPLETED
        self.completed_at = datetime.now(timezone.utc)
        self.completed_by_user_id = user_id

    def mark_in_progress(self):
        """Marca a etapa como em andamento"""
        from datetime import datetime, timezone
        self.status = WorkflowStageStatus.IN_PROGRESS
        self.started_at = datetime.now(timezone.utc)
