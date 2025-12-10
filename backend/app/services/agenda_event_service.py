from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import date, datetime
from ..models.agenda_event import AgendaEvent, EventType, EventStatus
from ..schemas.agenda_event import AgendaEventCreate, AgendaEventUpdate, AgendaEventFilter
from ..models.project import Project
from ..models.location import Location
from ..models.project_location import ProjectLocation

class AgendaEventService:
    def __init__(self, db: Session):
        self.db = db

    def create_event(self, event_data: AgendaEventCreate) -> AgendaEvent:
        """Criar novo evento na agenda"""
        db_event = AgendaEvent(**event_data.dict())
        self.db.add(db_event)
        self.db.commit()
        self.db.refresh(db_event)
        return db_event

    def get_event(self, event_id: int) -> Optional[AgendaEvent]:
        """Buscar evento por ID"""
        return self.db.query(AgendaEvent).filter(AgendaEvent.id == event_id).first()

    def get_events(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[AgendaEventFilter] = None
    ) -> List[AgendaEvent]:
        """Buscar eventos com filtros"""
        query = self.db.query(AgendaEvent)

        if filters:
            if filters.start_date:
                query = query.filter(AgendaEvent.event_date >= filters.start_date)
            if filters.end_date:
                query = query.filter(AgendaEvent.event_date <= filters.end_date)
            if filters.event_type:
                query = query.filter(AgendaEvent.event_type == filters.event_type)
            if filters.status:
                query = query.filter(AgendaEvent.status == filters.status)
            if filters.project_id:
                query = query.filter(AgendaEvent.project_id == filters.project_id)
            if filters.location_id:
                query = query.filter(AgendaEvent.location_id == filters.location_id)
            if filters.priority:
                query = query.filter(AgendaEvent.priority >= filters.priority)

        return query.offset(skip).limit(limit).all()

    def get_events_by_date_range(
        self,
        start_date: date,
        end_date: date
    ) -> List[AgendaEvent]:
        """Buscar eventos por período"""
        return self.db.query(AgendaEvent).filter(
            and_(
                AgendaEvent.event_date >= start_date,
                AgendaEvent.event_date <= end_date
            )
        ).order_by(AgendaEvent.event_date, AgendaEvent.start_time).all()

    def update_event(self, event_id: int, event_data: AgendaEventUpdate) -> Optional[AgendaEvent]:
        """Atualizar evento"""
        db_event = self.get_event(event_id)
        if not db_event:
            return None

        update_data = event_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_event, field, value)

        self.db.commit()
        self.db.refresh(db_event)
        return db_event

    def delete_event(self, event_id: int) -> bool:
        """Deletar evento"""
        db_event = self.get_event(event_id)
        if not db_event:
            return False

        self.db.delete(db_event)
        self.db.commit()
        return True

    def create_events_from_project_location(self, project_location: ProjectLocation) -> List[AgendaEvent]:
        """Criar eventos automaticamente baseados em uma locação de projeto"""
        events = []

        # Evento de início da locação
        start_event = AgendaEvent.create_from_project_location(
            project_location, EventType.LOCATION_RENTAL_START
        )
        if start_event:
            self.db.add(start_event)
            events.append(start_event)

        # Evento de fim da locação
        end_event = AgendaEvent.create_from_project_location(
            project_location, EventType.LOCATION_RENTAL_END
        )
        if end_event:
            self.db.add(end_event)
            events.append(end_event)

        # Evento de período completo (se for mais de 1 dia)
        if project_location.total_days and project_location.total_days > 1:
            full_event = AgendaEvent.create_from_project_location(
                project_location, EventType.LOCATION_RENTAL_FULL
            )
            if full_event:
                self.db.add(full_event)
                events.append(full_event)

        self.db.commit()
        return events

    def create_events_from_project(self, project: Project) -> List[AgendaEvent]:
        """Criar eventos automaticamente baseados em um projeto"""
        events = []

        # Evento de criação do projeto
        created_event = AgendaEvent.create_from_project(project, EventType.PROJECT_CREATED)
        if created_event:
            self.db.add(created_event)
            events.append(created_event)

        # Evento de início do projeto
        if project.start_date:
            start_event = AgendaEvent.create_from_project(project, EventType.PROJECT_START)
            if start_event:
                self.db.add(start_event)
                events.append(start_event)

        # Evento de fim do projeto
        if project.end_date:
            end_event = AgendaEvent.create_from_project(project, EventType.PROJECT_END)
            if end_event:
                self.db.add(end_event)
                events.append(end_event)

        self.db.commit()
        return events

    def delete_events_by_project_location(self, project_location_id: int) -> int:
        """Deletar eventos relacionados a uma locação de projeto"""
        deleted_count = self.db.query(AgendaEvent).filter(
            AgendaEvent.project_location_id == project_location_id
        ).delete()
        self.db.commit()
        return deleted_count

    def delete_events_by_project(self, project_id: int) -> int:
        """Deletar eventos relacionados a um projeto"""
        deleted_count = self.db.query(AgendaEvent).filter(
            AgendaEvent.project_id == project_id
        ).delete()
        self.db.commit()
        return deleted_count

    def get_upcoming_events(self, days: int = 7) -> List[AgendaEvent]:
        """Buscar eventos próximos"""
        today = date.today()
        end_date = date.fromordinal(today.toordinal() + days)

        return self.db.query(AgendaEvent).filter(
            and_(
                AgendaEvent.event_date >= today,
                AgendaEvent.event_date <= end_date,
                AgendaEvent.status != EventStatus.CANCELLED
            )
        ).order_by(AgendaEvent.event_date, AgendaEvent.start_time).all()

    def get_events_by_type(self, event_type: EventType) -> List[AgendaEvent]:
        """Buscar eventos por tipo"""
        return self.db.query(AgendaEvent).filter(
            AgendaEvent.event_type == event_type
        ).order_by(AgendaEvent.event_date).all()
