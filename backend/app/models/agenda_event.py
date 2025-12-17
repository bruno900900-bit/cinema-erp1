from sqlalchemy import Column, String, Text, Date, Time, Integer, ForeignKey, Enum, JSON, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class EventType(str, enum.Enum):
    PROJECT_CREATED = "project_created"
    PROJECT_START = "project_start"
    PROJECT_END = "project_end"
    LOCATION_RENTAL_START = "location_rental_start"
    LOCATION_RENTAL_END = "location_rental_end"
    LOCATION_RENTAL_FULL = "location_rental_full"
    VISIT_SCHEDULED = "visit_scheduled"
    TECHNICAL_VISIT = "technical_visit"
    FILMING_START = "filming_start"
    FILMING_END = "filming_end"
    FILMING_PERIOD = "filming_period"
    DELIVERY = "delivery"
    CONTRACT_SIGNED = "contract_signed"
    PAYMENT_DUE = "payment_due"
    CUSTOM = "custom"


class EventStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    POSTPONED = "postponed"

class AgendaEvent(Base, TimestampMixin):
    __tablename__ = "agenda_events"
    __table_args__ = {'extend_existing': True}

    # Informações básicas
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(Enum(EventType), nullable=False)
    status = Column(Enum(EventStatus), default=EventStatus.SCHEDULED)

    # Datas e horários
    # Datas e horários
    start_date = Column(String, nullable=False)  # Armazenado como ISO string no DB atual
    end_date = Column(String, nullable=True)
    all_day = Column(Boolean, default=False)

    # Mantendo compatibilidade de nomes na classe se necessário, mas mapeando para colunas reais
    # ou simplesmente alterando o modelo. Vamos alterar para refletir a realidade.
    # event_date = ... (REMOVIDO - Não existe no banco)
    # start_time = ... (REMOVIDO)
    # end_time = ... (REMOVIDO)
    # is_all_day = ... (REMOVIDO)

    # Relacionamentos opcionais
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    project_location_id = Column(Integer, ForeignKey("project_locations.id"), nullable=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True)

    # Dados adicionais
    metadata_json = Column(JSON, nullable=True)  # Dados específicos do tipo de evento
    color = Column(String(7), nullable=True)  # Cor do evento no calendário (hex)
    priority = Column(Integer, default=1)  # 1=baixa, 2=média, 3=alta

    # Relacionamentos
    project = relationship("Project")
    location = relationship("Location")
    project_location = relationship("ProjectLocation")
    visit = relationship("Visit")
    contract = relationship("Contract")

    def __repr__(self):
        return f"<AgendaEvent(id={self.id}, title='{self.title}', date='{self.start_date}', type='{self.event_type}')>"

    @classmethod
    def create_from_project_location(cls, project_location, event_type: EventType):
        """Cria evento da agenda baseado em uma locação de projeto"""
        if event_type == EventType.LOCATION_RENTAL_START:
            title = f"Início da locação: {project_location.location.title}"
            description = f"Início da locação da locação '{project_location.location.title}' para o projeto '{project_location.project.name}'"
            start_date = project_location.rental_start_date.isoformat() if project_location.rental_start_date else None
            end_date = None
        elif event_type == EventType.LOCATION_RENTAL_END:
            title = f"Fim da locação: {project_location.location.title}"
            description = f"Fim da locação da locação '{project_location.location.title}' para o projeto '{project_location.project.name}'"
            start_date = project_location.rental_end_date.isoformat() if project_location.rental_end_date else None
            end_date = None
        elif event_type == EventType.LOCATION_RENTAL_FULL:
            title = f"Locação completa: {project_location.location.title}"
            description = f"Período completo da locação '{project_location.location.title}' para o projeto '{project_location.project.name}' ({project_location.total_days} dias)"
            start_date = project_location.rental_start_date.isoformat() if project_location.rental_start_date else None
            end_date = project_location.rental_end_date.isoformat() if project_location.rental_end_date else None
        else:
            return None

        return cls(
            title=title,
            description=description,
            event_type=event_type,
            start_date=start_date,
            end_date=end_date,
            all_day=False,
            project_id=project_location.project_id,
            location_id=project_location.location_id,
            project_location_id=project_location.id,
            color="#4CAF50" if event_type == EventType.LOCATION_RENTAL_START else "#FF9800" if event_type == EventType.LOCATION_RENTAL_END else "#2196F3",
            priority=2,
            metadata_json={
                "project_name": project_location.project.name,
                "location_name": project_location.location.title,
                "daily_rate": project_location.daily_rate,
                "total_cost": project_location.total_cost,
                "currency": project_location.currency
            }
        )

    @classmethod
    def create_from_project(cls, project, event_type: EventType):
        """Cria evento da agenda baseado em um projeto"""
        if event_type == EventType.PROJECT_CREATED:
            title = f"Projeto criado: {project.name}"
            description = f"Projeto '{project.name}' foi criado"
            start_date = project.created_at.date().isoformat() if hasattr(project.created_at, 'date') else str(project.created_at)
        elif event_type == EventType.PROJECT_START:
            title = f"Início do projeto: {project.name}"
            description = f"Início do projeto '{project.name}'"
            start_date = project.start_date.isoformat() if hasattr(project.start_date, 'isoformat') else str(project.start_date)
        elif event_type == EventType.PROJECT_END:
            title = f"Fim do projeto: {project.name}"
            description = f"Fim do projeto '{project.name}'"
            start_date = project.end_date.isoformat() if hasattr(project.end_date, 'isoformat') else str(project.end_date)
        else:
            return None

        return cls(
            title=title,
            description=description,
            event_type=event_type,
            start_date=start_date,
            end_date=None,
            all_day=True,
            project_id=project.id,
            color="#9C27B0" if event_type == EventType.PROJECT_CREATED else "#4CAF50" if event_type == EventType.PROJECT_START else "#F44336",
            priority=1,
            metadata_json={
                "project_name": project.name,
                "client_name": project.client_name,
                "budget_total": project.budget_total,
                "currency": project.budget_currency
            }
        )
