from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, Integer, Float, Boolean, JSON, Date
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class RentalStatus(str, enum.Enum):
    RESERVED = "reserved"                # Reservada
    CONFIRMED = "confirmed"              # Confirmada
    IN_USE = "in_use"                    # Em uso
    RETURNED = "returned"                # Devolvida
    OVERDUE = "overdue"                  # Atrasada
    CANCELLED = "cancelled"              # Cancelada

class ProjectLocation(Base, TimestampMixin):
    """
    Relacionamento entre Projeto e Locação
    Representa uma locação específica dentro de um projeto
    """
    __tablename__ = "project_locations"
    __table_args__ = {'extend_existing': True}

    # Relacionamentos obrigatórios
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)

    # Informações da locação no projeto
    rental_start = Column(Date, nullable=False)
    rental_end = Column(Date, nullable=False)
    rental_start_time = Column(DateTime(timezone=True), nullable=True)  # Horário específico de início
    rental_end_time = Column(DateTime(timezone=True), nullable=True)    # Horário específico de fim

    # Preços e custos
    daily_rate = Column(Float, nullable=False, default=0.0)
    hourly_rate = Column(Float, nullable=True)
    total_cost = Column(Float, nullable=False, default=0.0)
    currency = Column(String(3), default="BRL")

    # Status da locação
    status = Column(Enum(RentalStatus), default=RentalStatus.RESERVED)

    # Progresso geral da locação (calculado a partir das etapas)
    completion_percentage = Column(Float, default=0.0)  # 0.0 a 100.0

    # Responsáveis específicos para esta locação
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    coordinator_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Configurações específicas
    notes = Column(Text, nullable=True)
    special_requirements = Column(Text, nullable=True)  # Requisitos especiais
    equipment_needed = Column(Text, nullable=True)      # Equipamentos necessários

    # ===== DATAS DE PRODUÇÃO =====
    # Visitação inicial
    visit_date = Column(Date, nullable=True)
    visit_time = Column(DateTime(timezone=True), nullable=True)

    # Visita técnica
    technical_visit_date = Column(Date, nullable=True)
    technical_visit_time = Column(DateTime(timezone=True), nullable=True)

    # Gravação/Filmagem
    filming_start_date = Column(Date, nullable=True)
    filming_end_date = Column(Date, nullable=True)
    filming_start_time = Column(DateTime(timezone=True), nullable=True)
    filming_end_time = Column(DateTime(timezone=True), nullable=True)

    # Entrega da locação
    delivery_date = Column(Date, nullable=True)
    delivery_time = Column(DateTime(timezone=True), nullable=True)

    # Documentos e anexos
    contract_url = Column(String(500), nullable=True)
    attachments_json = Column(JSON, nullable=True)

    # Relacionamentos
    project = relationship("Project", back_populates="project_locations")
    location = relationship("Location", back_populates="project_locations")
    responsible_user = relationship("User", foreign_keys=[responsible_user_id])
    coordinator_user = relationship("User", foreign_keys=[coordinator_user_id])
    stages = relationship("ProjectLocationStage", back_populates="project_location", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ProjectLocation(id={self.id}, project_id={self.project_id}, location_id={self.location_id}, status='{self.status}')>"

    @property
    def duration_days(self) -> int:
        """Calcula a duração em dias"""
        if self.rental_start and self.rental_end:
            return (self.rental_end - self.rental_start).days + 1
        return 0

    @property
    def is_active(self) -> bool:
        """Verifica se a locação está ativa"""
        return self.status in [RentalStatus.CONFIRMED, RentalStatus.IN_USE]

    @property
    def is_overdue(self) -> bool:
        """Verifica se a locação está atrasada"""
        if not self.rental_end or self.status == RentalStatus.RETURNED:
            return False
        from datetime import date
        return date.today() > self.rental_end

    def calculate_total_cost(self) -> float:
        """Calcula o custo total baseado na duração e taxa diária"""
        if self.hourly_rate and self.rental_start_time and self.rental_end_time:
            # Cálculo por hora se especificado
            duration_hours = (self.rental_end_time - self.rental_start_time).total_seconds() / 3600
            return duration_hours * self.hourly_rate
        else:
            # Cálculo por dia
            return self.duration_days * self.daily_rate

    def update_completion_percentage(self):
        """Atualiza o percentual de conclusão baseado nas etapas"""
        if not self.stages:
            self.completion_percentage = 0.0
            return

        total_weight = sum(stage.weight for stage in self.stages)
        if total_weight == 0:
            self.completion_percentage = 0.0
            return

        weighted_completion = sum(
            stage.completion_percentage * stage.weight
            for stage in self.stages
        )
        self.completion_percentage = weighted_completion / total_weight
