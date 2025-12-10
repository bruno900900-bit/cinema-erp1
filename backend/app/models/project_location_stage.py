from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, Integer, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class LocationStageType(str, enum.Enum):
    PROSPECCAO = "prospeccao"            # Prospecção inicial (busca por locações)
    VISITACAO = "visitacao"              # Visitação inicial do local
    AVALIACAO_TECNICA = "avaliacao_tecnica"  # Avaliação técnica detalhada
    APROVACAO_CLIENTE = "aprovacao_cliente"  # Aprovação pelo cliente
    NEGOCIACAO = "negociacao"            # Negociação de preços e condições
    CONTRATACAO = "contratacao"          # Assinatura do contrato
    PREPARACAO = "preparacao"            # Preparação do local
    SETUP = "setup"                      # Montagem e configuração
    GRAVACAO = "gravacao"                # Período de gravação/filmagem
    DESMONTAGEM = "desmontagem"          # Desmontagem do equipamento
    ENTREGA = "entrega"                  # Entrega final do local

class StageStatus(str, enum.Enum):
    PENDING = "pending"                  # Aguardando início
    IN_PROGRESS = "in_progress"          # Em andamento
    COMPLETED = "completed"              # Concluída
    CANCELLED = "cancelled"              # Cancelada
    ON_HOLD = "on_hold"                  # Em espera

class ProjectLocationStage(Base, TimestampMixin):
    """
    Etapas de uma locação dentro de um projeto
    Define o fluxo completo desde a visitação até a entrega
    """
    __tablename__ = "project_location_stages"
    __table_args__ = {'extend_existing': True}

    # Relacionamentos obrigatórios
    project_location_id = Column(Integer, ForeignKey("project_locations.id"), nullable=False)

    # Informações da etapa
    stage_type = Column(Enum(LocationStageType), nullable=False)
    title = Column(String(255), nullable=False)  # Título da etapa
    description = Column(Text, nullable=True)    # Descrição detalhada

    # Status e progresso
    status = Column(Enum(StageStatus), default=StageStatus.PENDING)
    completion_percentage = Column(Float, default=0.0)  # 0.0 a 100.0

    # Datas
    planned_start_date = Column(DateTime(timezone=True), nullable=True)
    planned_end_date = Column(DateTime(timezone=True), nullable=True)
    actual_start_date = Column(DateTime(timezone=True), nullable=True)
    actual_end_date = Column(DateTime(timezone=True), nullable=True)

    # Responsáveis
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    coordinator_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Configurações e pesos
    weight = Column(Float, default=1.0)  # Peso da etapa para cálculo de progresso
    is_milestone = Column(Boolean, default=False)  # Se é um marco importante
    is_critical = Column(Boolean, default=False)   # Se é crítica para o projeto

    # Observações e anexos
    notes = Column(Text, nullable=True)
    attachments_json = Column(JSON, nullable=True)  # URLs de anexos

    # Dependências (etapas que devem ser concluídas antes desta)
    dependencies_json = Column(JSON, nullable=True)  # IDs das etapas dependentes

    # Audit trail - rastreamento de mudanças
    status_changed_at = Column(DateTime(timezone=True), nullable=True)
    status_changed_by_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    completion_changed_at = Column(DateTime(timezone=True), nullable=True)
    completion_changed_by_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)

    # Relacionamentos
    project_location = relationship("ProjectLocation", back_populates="stages")
    responsible_user = relationship("User", foreign_keys=[responsible_user_id])
    coordinator_user = relationship("User", foreign_keys=[coordinator_user_id])
    status_changed_by_user = relationship("User", foreign_keys=[status_changed_by_user_id])
    completion_changed_by_user = relationship("User", foreign_keys=[completion_changed_by_user_id])

    def __repr__(self):
        return f"<ProjectLocationStage(id={self.id}, stage_type='{self.stage_type}', status='{self.status}', completion={self.completion_percentage}%)>"

    @property
    def is_overdue(self) -> bool:
        """Verifica se a etapa está atrasada"""
        if not self.planned_end_date or self.status == StageStatus.COMPLETED:
            return False
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        planned_end = self.planned_end_date
        if planned_end.tzinfo is None:
            planned_end = planned_end.replace(tzinfo=timezone.utc)
        return now > planned_end

    @property
    def is_delayed(self) -> bool:
        """Verifica se a etapa está atrasada em relação ao prazo"""
        if not self.planned_end_date or not self.actual_end_date:
            return False

        # Ensure compatible timezones
        planned = self.planned_end_date
        actual = self.actual_end_date

        from datetime import timezone

        if planned.tzinfo is None and actual.tzinfo is not None:
             planned = planned.replace(tzinfo=timezone.utc)
        elif planned.tzinfo is not None and actual.tzinfo is None:
             actual = actual.replace(tzinfo=timezone.utc)

        return actual > planned

    def calculate_completion_percentage(self) -> float:
        """Calcula o percentual de conclusão baseado no status"""
        if self.status == StageStatus.COMPLETED:
            return 100.0
        elif self.status == StageStatus.IN_PROGRESS:
            return 50.0
        elif self.status == StageStatus.PENDING:
            return 0.0
        elif self.status == StageStatus.CANCELLED:
            return 0.0
        elif self.status == StageStatus.ON_HOLD:
            return 25.0
        return 0.0
