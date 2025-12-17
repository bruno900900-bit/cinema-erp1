from sqlalchemy import Column, Integer, ForeignKey, DateTime, Float, Text, Enum
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
from .project_location_stage import StageStatus

class ProjectLocationStageHistory(Base, TimestampMixin):
    """
    Histórico de alterações de status das etapas de locação
    Cada mudança de status é registrada para auditoria completa
    """
    __tablename__ = "project_location_stage_history"
    __table_args__ = {'extend_existing': True}

    # Relacionamento com a etapa
    stage_id = Column(Integer, ForeignKey("project_location_stages.id", ondelete="CASCADE"), nullable=False, index=True)

    # Status anterior e novo
    previous_status = Column(Enum(StageStatus), nullable=True)  # Null se for a primeira mudança
    new_status = Column(Enum(StageStatus), nullable=False)

    # Percentual de conclusão anterior e novo
    previous_completion = Column(Float, nullable=True)
    new_completion = Column(Float, nullable=False)

    # Usuário que fez a mudança
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Notas/comentários sobre a mudança
    change_notes = Column(Text, nullable=True)

    # Data/hora da mudança
    changed_at = Column(DateTime(timezone=True), nullable=False)

    # Relacionamentos
    stage = relationship("ProjectLocationStage", foreign_keys=[stage_id])
    changed_by = relationship("User", foreign_keys=[changed_by_user_id])

    def __repr__(self):
        return f"<StageHistory(id={self.id}, stage={self.stage_id}, {self.previous_status}->{self.new_status}, by={self.changed_by_user_id})>"
