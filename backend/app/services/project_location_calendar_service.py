"""
Service para criar e sincronizar eventos do calendário baseados em ProjectLocations.

Este service é responsável por:
1. Criar eventos automáticos quando uma ProjectLocation é criada/editada
2. Atualizar eventos quando datas são modificadas
3. Deletar eventos quando uma ProjectLocation é removida
4. Sincronizar mudanças bidirecionalmente entre ProjectLocation e AgendaEvent
"""

from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime

from ..models.project_location import ProjectLocation
from ..models.agenda_event import AgendaEvent, EventType, EventStatus
from ..models.location import Location
from ..models.project import Project


class ProjectLocationCalendarService:
    """Service para gerenciar eventos do calendário relacionados a ProjectLocations"""

    @staticmethod
    def create_all_events(
        db: Session,
        project_location: ProjectLocation
    ) -> List[AgendaEvent]:
        """
        Cria todos os eventos do calendário para uma ProjectLocation.

        Eventos criados automaticamente:
        - Visitação (se visit_date preenchido)
        - Visita Técnica (se technical_visit_date preenchido)
        - Início de Filmagem (se filming_start_date preenchido)
        - Fim de Filmagem (se filming_end_date preenchido)
        - Período de Filmagem (se start E end preenchidos)
        - Entrega (se delivery_date preenchido)
        - Período de Locação (rental_start e rental_end)
        """
        created_events = []

        # Buscar location e project para títulos
        location = db.query(Location).filter(Location.id == project_location.location_id).first()
        project = db.query(Project).filter(Project.id == project_location.project_id).first()

        if not location or not project:
            return created_events

        location_name = location.title
        project_name = project.name

        # 1. Visitação Inicial
        if project_location.visit_date:
            event = AgendaEvent(
                title=f"Visitação: {location_name}",
                description=f"Visitação inicial da locação '{location_name}' para o projeto '{project_name}'",
                event_type=EventType.VISIT_SCHEDULED,
                status=EventStatus.SCHEDULED,
                start_date=project_location.visit_date.isoformat(),
                end_date=None,
                all_day=project_location.visit_time is None,
                project_id=project_location.project_id,
                location_id=project_location.location_id,
                project_location_id=project_location.id,
                color="#4CAF50",  # Verde
                priority=2,
                metadata_json={
                    "project_name": project_name,
                    "location_name": location_name,
                    "event_source": "project_location_dates"
                }
            )
            db.add(event)
            created_events.append(event)

        # 2. Visitação Técnica
        if project_location.technical_visit_date:
            event = AgendaEvent(
                title=f"Visita Técnica: {location_name}",
                description=f"Avaliação técnica detalhada da locação '{location_name}' para o projeto '{project_name}'",
                event_type=EventType.TECHNICAL_VISIT,
                status=EventStatus.SCHEDULED,
                start_date=project_location.technical_visit_date.isoformat(),
                end_date=None,
                all_day=project_location.technical_visit_time is None,
                project_id=project_location.project_id,
                location_id=project_location.location_id,
                project_location_id=project_location.id,
                color="#2196F3",  # Azul
                priority=2,
                metadata_json={
                    "project_name": project_name,
                    "location_name": location_name,
                    "event_source": "project_location_dates"
                }
            )
            db.add(event)
            created_events.append(event)

        # 3. Início de Gravação
        if project_location.filming_start_date:
            event = AgendaEvent(
                title=f"Início de Gravação: {location_name}",
                description=f"Início da filmagem na locação '{location_name}' para o projeto '{project_name}'",
                event_type=EventType.FILMING_START,
                status=EventStatus.SCHEDULED,
                start_date=project_location.filming_start_date.isoformat(),
                end_date=None,
                all_day=project_location.filming_start_time is None,
                project_id=project_location.project_id,
                location_id=project_location.location_id,
                project_location_id=project_location.id,
                color="#FF9800",  # Laranja
                priority=3,  # Alta prioridade
                metadata_json={
                    "project_name": project_name,
                    "location_name": location_name,
                    "event_source": "project_location_dates"
                }
            )
            db.add(event)
            created_events.append(event)

        # 4. Fim de Gravação
        if project_location.filming_end_date:
            event = AgendaEvent(
                title=f"Fim de Gravação: {location_name}",
                description=f"Fim da filmagem na locação '{location_name}' para o projeto '{project_name}'",
                event_type=EventType.FILMING_END,
                status=EventStatus.SCHEDULED,
                start_date=project_location.filming_end_date.isoformat(),
                end_date=None,
                all_day=project_location.filming_end_time is None,
                project_id=project_location.project_id,
                location_id=project_location.location_id,
                project_location_id=project_location.id,
                color="#FF5722",  # Laranja escuro
                priority=3,  # Alta prioridade
                metadata_json={
                    "project_name": project_name,
                    "location_name": location_name,
                    "event_source": "project_location_dates"
                }
            )
            db.add(event)
            created_events.append(event)

        # 5. Período Completo de Gravação (se ambos start e end existem)
        if project_location.filming_start_date and project_location.filming_end_date:
            days = (project_location.filming_end_date - project_location.filming_start_date).days + 1
            event = AgendaEvent(
                title=f"Gravação: {location_name}",
                description=f"Período completo de filmagem ({days} dias) na locação '{location_name}' para o projeto '{project_name}'",
                event_type=EventType.FILMING_PERIOD,
                status=EventStatus.SCHEDULED,
                start_date=project_location.filming_start_date.isoformat(),
                end_date=project_location.filming_end_date.isoformat(),
                all_day=True,
                project_id=project_location.project_id,
                location_id=project_location.location_id,
                project_location_id=project_location.id,
                color="#FFC107",  # Âmbar
                priority=3,
                metadata_json={
                    "project_name": project_name,
                    "location_name": location_name,
                    "duration_days": days,
                    "event_source": "project_location_dates"
                }
            )
            db.add(event)
            created_events.append(event)

        # 6. Entrega
        if project_location.delivery_date:
            event = AgendaEvent(
                title=f"Entrega: {location_name}",
                description=f"Entrega final da locação '{location_name}' para o projeto '{project_name}'",
                event_type=EventType.DELIVERY,
                status=EventStatus.SCHEDULED,
                start_date=project_location.delivery_date.isoformat(),
                end_date=None,
                all_day=project_location.delivery_time is None,
                project_id=project_location.project_id,
                location_id=project_location.location_id,
                project_location_id=project_location.id,
                color="#F44336",  # Vermelho
                priority=3,
                metadata_json={
                    "project_name": project_name,
                    "location_name": location_name,
                    "event_source": "project_location_dates"
                }
            )
            db.add(event)
            created_events.append(event)

        # 7. Período de Locação (sempre criado - campos obrigatórios)
        if project_location.rental_start and project_location.rental_end:
            days = (project_location.rental_end - project_location.rental_start).days + 1
            event = AgendaEvent(
                title=f"Locação: {location_name}",
                description=f"Período completo de locação ({days} dias) da '{location_name}' para o projeto '{project_name}'",
                event_type=EventType.LOCATION_RENTAL_FULL,
                status=EventStatus.SCHEDULED,
                start_date=project_location.rental_start.isoformat(),
                end_date=project_location.rental_end.isoformat(),
                all_day=True,
                project_id=project_location.project_id,
                location_id=project_location.location_id,
                project_location_id=project_location.id,
                color="#9C27B0",  # Roxo
                priority=2,
                metadata_json={
                    "project_name": project_name,
                    "location_name": location_name,
                    "daily_rate": float(project_location.daily_rate) if project_location.daily_rate else 0,
                    "total_cost": float(project_location.total_cost) if project_location.total_cost else 0,
                    "duration_days": days,
                    "event_source": "project_location_dates"
                }
            )
            db.add(event)
            created_events.append(event)

        db.commit()
        return created_events

    @staticmethod
    def update_events(
        db: Session,
        project_location: ProjectLocation
    ) -> List[AgendaEvent]:
        """
        Atualiza todos os eventos vinculados a uma ProjectLocation.

        Remove eventos antigos e cria novos baseados nas datas atuais.
        """
        # Deletar eventos existentes
        ProjectLocationCalendarService.delete_events(db, project_location.id)

        # Criar novos eventos
        return ProjectLocationCalendarService.create_all_events(db, project_location)

    @staticmethod
    def delete_events(
        db: Session,
        project_location_id: int
    ) -> int:
        """
        Deleta todos os eventos vinculados a uma ProjectLocation.

        Returns:
            Número de eventos deletados
        """
        deleted = db.query(AgendaEvent).filter(
            AgendaEvent.project_location_id == project_location_id
        ).delete()
        db.commit()
        return deleted

    @staticmethod
    def sync_event_to_project_location(
        db: Session,
        event: AgendaEvent,
        project_location: ProjectLocation
    ) -> bool:
        """
        Sincroniza mudanças de um evento para a ProjectLocation correspondente.

        Usado quando um evento é editado no calendário.
        """
        if not event.project_location_id:
            return False

        updated = False

        # Mapear tipo de evento para campo de data
        if event.event_type == EventType.VISIT_SCHEDULED:
            if event.start_date:
                project_location.visit_date = datetime.fromisoformat(event.start_date).date()
                updated = True

        elif event.event_type == EventType.TECHNICAL_VISIT:
            if event.start_date:
                project_location.technical_visit_date = datetime.fromisoformat(event.start_date).date()
                updated = True

        elif event.event_type == EventType.FILMING_START:
            if event.start_date:
                project_location.filming_start_date = datetime.fromisoformat(event.start_date).date()
                updated = True

        elif event.event_type == EventType.FILMING_END:
            if event.start_date:
                project_location.filming_end_date = datetime.fromisoformat(event.start_date).date()
                updated = True

        elif event.event_type == EventType.FILMING_PERIOD:
            if event.start_date:
                project_location.filming_start_date = datetime.fromisoformat(event.start_date).date()
            if event.end_date:
                project_location.filming_end_date = datetime.fromisoformat(event.end_date).date()
            updated = True

        elif event.event_type == EventType.DELIVERY:
            if event.start_date:
                project_location.delivery_date = datetime.fromisoformat(event.start_date).date()
                updated = True

        elif event.event_type == EventType.LOCATION_RENTAL_FULL:
            if event.start_date:
                project_location.rental_start = datetime.fromisoformat(event.start_date).date()
            if event.end_date:
                project_location.rental_end = datetime.fromisoformat(event.end_date).date()
            updated = True

        if updated:
            db.commit()

        return updated


# Instância singleton
project_location_calendar_service = ProjectLocationCalendarService()
