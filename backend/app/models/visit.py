from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, Integer
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class VisitEtapa(str, enum.Enum):
    PROSPECCAO = "prospeccao"
    VISITA_TECNICA = "visita_tecnica"
    APROVACAO = "aprovacao"
    NEGOCIACAO = "negociacao"
    CONTRATACAO = "contratacao"

class VisitStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Visit(Base, TimestampMixin):
    __tablename__ = "visits"
    __table_args__ = {'extend_existing': True}

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    etapa = Column(Enum(VisitEtapa), nullable=False)
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(VisitStatus), default=VisitStatus.SCHEDULED)

    # Chaves estrangeiras
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Responsável principal
    coordinator_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Coordenador

    # Relacionamentos
    project = relationship("Project", back_populates="visits")
    location = relationship("Location", back_populates="visits")
    # Temporariamente comentado para compatibilidade
    # created_by_user = relationship("User", back_populates="created_visits", foreign_keys=[created_by])
    # Temporariamente comentado para compatibilidade
    # responsible_user = relationship("User", back_populates="responsible_visits", foreign_keys=[responsible_user_id])
    # coordinator_user = relationship("User", back_populates="coordinated_visits", foreign_keys=[coordinator_user_id])
    participants = relationship("VisitParticipant", back_populates="visit", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Visit(id={self.id}, title='{self.title}', etapa='{self.etapa}', status='{self.status}')>"

class VisitParticipant(Base, TimestampMixin):
    __tablename__ = "visit_participants"
    __table_args__ = {'extend_existing': True}

    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(100), nullable=False)  # ex.: "responsável", "apoio"
    check_in_time = Column(DateTime(timezone=True), nullable=True)
    check_out_time = Column(DateTime(timezone=True), nullable=True)

    # Relacionamentos
    visit = relationship("Visit", back_populates="participants")
    # Temporariamente comentado para compatibilidade
    # user = relationship("User", back_populates="visit_participations")

    def __repr__(self):
        return f"<VisitParticipant(id={self.id}, visit_id={self.visit_id}, user_id={self.user_id}, role='{self.role}')>"
