from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, asc
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timezone
from ..models.project_location import ProjectLocation, RentalStatus
from ..models.project_location_stage import ProjectLocationStage
from ..models.location import Location
from ..models.user import User
from ..schemas.project_location import (
    ProjectLocationCreate,
    ProjectLocationUpdate,
    ProjectLocationFilter
)
from .project_location_stage_service import ProjectLocationStageService

class ProjectLocationService:
    def __init__(self, db: Session):
        self.db = db
        self.stage_service = ProjectLocationStageService(db)

    def create_project_location(self, location_data: ProjectLocationCreate) -> ProjectLocation:
        """Cria uma nova locação em um projeto"""
        # Calcula o custo total automaticamente
        location_data.total_cost = self._calculate_total_cost(
            location_data.daily_rate,
            location_data.hourly_rate,
            location_data.rental_start,
            location_data.rental_end,
            location_data.rental_start_time,
            location_data.rental_end_time
        )

        project_location = ProjectLocation(**location_data.dict())
        self.db.add(project_location)
        self.db.commit()
        self.db.refresh(project_location)

        # Cria etapas padrão automaticamente
        self.stage_service.create_default_stages(project_location.id)

        return project_location

    def get_project_location(self, location_id: int) -> Optional[ProjectLocation]:
        """Obtém uma locação específica de projeto"""
        return self.db.query(ProjectLocation).options(
            joinedload(ProjectLocation.location),
            joinedload(ProjectLocation.responsible_user),
            joinedload(ProjectLocation.coordinator_user),
            joinedload(ProjectLocation.stages).joinedload(ProjectLocationStage.responsible_user),
            joinedload(ProjectLocation.stages).joinedload(ProjectLocationStage.coordinator_user)
        ).filter(ProjectLocation.id == location_id).first()

    def get_project_locations_by_project(self, project_id: int) -> List[ProjectLocation]:
        """Obtém todas as locações de um projeto"""
        return self.db.query(ProjectLocation).options(
            joinedload(ProjectLocation.location),
            joinedload(ProjectLocation.responsible_user),
            joinedload(ProjectLocation.coordinator_user),
            joinedload(ProjectLocation.stages)
        ).filter(ProjectLocation.project_id == project_id).order_by(
            ProjectLocation.rental_start.asc()
        ).all()

    def get_project_locations_with_filters(self, filters: ProjectLocationFilter, skip: int = 0, limit: int = 100) -> List[ProjectLocation]:
        """Busca locações de projeto com filtros"""
        query = self.db.query(ProjectLocation).options(
            joinedload(ProjectLocation.location),
            joinedload(ProjectLocation.responsible_user),
            joinedload(ProjectLocation.coordinator_user),
            joinedload(ProjectLocation.stages)
        )

        # Aplicar filtros
        if filters.project_ids:
            query = query.filter(ProjectLocation.project_id.in_(filters.project_ids))

        if filters.location_ids:
            query = query.filter(ProjectLocation.location_id.in_(filters.location_ids))

        if filters.status:
            query = query.filter(ProjectLocation.status.in_(filters.status))

        if filters.responsible_user_ids:
            query = query.filter(ProjectLocation.responsible_user_id.in_(filters.responsible_user_ids))

        if filters.is_overdue is not None:
            if filters.is_overdue:
                query = query.filter(
                    and_(
                        ProjectLocation.rental_end < date.today(),
                        ProjectLocation.status != RentalStatus.RETURNED
                    )
                )
            else:
                query = query.filter(
                    or_(
                        ProjectLocation.rental_end >= date.today(),
                        ProjectLocation.status == RentalStatus.RETURNED
                    )
                )

        if filters.is_active is not None:
            if filters.is_active:
                query = query.filter(ProjectLocation.status.in_([RentalStatus.CONFIRMED, RentalStatus.IN_USE]))
            else:
                query = query.filter(ProjectLocation.status.notin_([RentalStatus.CONFIRMED, RentalStatus.IN_USE]))

        if filters.date_from:
            query = query.filter(ProjectLocation.rental_start >= filters.date_from)

        if filters.date_to:
            query = query.filter(ProjectLocation.rental_end <= filters.date_to)

        if filters.min_cost:
            query = query.filter(ProjectLocation.total_cost >= filters.min_cost)

        if filters.max_cost:
            query = query.filter(ProjectLocation.total_cost <= filters.max_cost)

        return query.order_by(ProjectLocation.rental_start.asc()).offset(skip).limit(limit).all()

    def update_project_location(self, location_id: int, location_data: ProjectLocationUpdate) -> Optional[ProjectLocation]:
        """Atualiza uma locação de projeto"""
        project_location = self.get_project_location(location_id)
        if not project_location:
            return None

        update_data = location_data.dict(exclude_unset=True)

        # Se mudou datas ou preços, recalcula o custo total
        if any(field in update_data for field in ['daily_rate', 'hourly_rate', 'rental_start', 'rental_end', 'rental_start_time', 'rental_end_time']):
            update_data['total_cost'] = self._calculate_total_cost(
                update_data.get('daily_rate', project_location.daily_rate),
                update_data.get('hourly_rate', project_location.hourly_rate),
                update_data.get('rental_start', project_location.rental_start),
                update_data.get('rental_end', project_location.rental_end),
                update_data.get('rental_start_time', project_location.rental_start_time),
                update_data.get('rental_end_time', project_location.rental_end_time)
            )

        for field, value in update_data.items():
            setattr(project_location, field, value)

        self.db.commit()
        self.db.refresh(project_location)

        return project_location

    def delete_project_location(self, location_id: int) -> bool:
        """Remove uma locação de projeto"""
        project_location = self.get_project_location(location_id)
        if not project_location:
            return False

        self.db.delete(project_location)
        self.db.commit()
        return True

    def get_project_cost_summary(self, project_id: int) -> Dict[str, Any]:
        """Obtém resumo de custos de um projeto"""
        locations = self.get_project_locations_by_project(project_id)

        total_cost = sum(loc.total_cost for loc in locations)
        total_locations = len(locations)
        average_daily_cost = total_cost / total_locations if total_locations > 0 else 0

        # Custo por status
        cost_by_status = {}
        for status in RentalStatus:
            status_locations = [loc for loc in locations if loc.status == status]
            cost_by_status[status.value] = sum(loc.total_cost for loc in status_locations)

        # Custo por locação
        cost_by_location = []
        for loc in locations:
            cost_by_location.append({
                'location_id': loc.id,
                'location_title': loc.location.title if loc.location else 'Locação não encontrada',
                'total_cost': loc.total_cost,
                'status': loc.status.value,
                'duration_days': loc.duration_days
            })

        return {
            'project_id': project_id,
            'total_locations': total_locations,
            'total_cost': total_cost,
            'average_daily_cost': average_daily_cost,
            'cost_by_status': cost_by_status,
            'cost_by_location': cost_by_location,
            'currency': 'BRL'
        }

    def get_project_timeline(self, project_id: int) -> Dict[str, Any]:
        """Obtém timeline de locações de um projeto"""
        locations = self.get_project_locations_by_project(project_id)

        # Timeline de locações
        location_timeline = []
        for loc in locations:
            location_timeline.append({
                'id': loc.id,
                'title': loc.location.title if loc.location else 'Locação não encontrada',
                'start_date': loc.rental_start,
                'end_date': loc.rental_end,
                'status': loc.status.value,
                'completion_percentage': loc.completion_percentage,
                'is_overdue': loc.is_overdue
            })

        # Marcos (milestones)
        milestones = []
        for loc in locations:
            for stage in loc.stages:
                if stage.is_milestone:
                    milestones.append({
                        'id': stage.id,
                        'title': stage.title,
                        'date': stage.planned_end_date,
                        'status': stage.status.value,
                        'location_title': loc.location.title if loc.location else 'Locação não encontrada',
                        'is_critical': stage.is_critical
                    })

        milestones.sort(key=lambda x: x['date'] or datetime.max.replace(tzinfo=timezone.utc))

        # Caminho crítico (etapas críticas em sequência)
        critical_path = []
        for loc in locations:
            critical_stages = [s for s in loc.stages if s.is_critical]
            critical_stages.sort(key=lambda x: x.planned_start_date or datetime.min.replace(tzinfo=timezone.utc))
            critical_path.extend(critical_stages)

        return {
            'project_id': project_id,
            'locations': location_timeline,
            'milestones': milestones,
            'critical_path': critical_path
        }

    def _calculate_total_cost(self, daily_rate: float, hourly_rate: Optional[float],
                            rental_start: date, rental_end: date,
                            rental_start_time: Optional[datetime] = None,
                            rental_end_time: Optional[datetime] = None) -> float:
        """Calcula o custo total de uma locação"""
        if hourly_rate and rental_start_time and rental_end_time:
            # Cálculo por hora
            duration_hours = (rental_end_time - rental_start_time).total_seconds() / 3600
            return duration_hours * hourly_rate
        else:
            # Cálculo por dia
            duration_days = (rental_end - rental_start).days + 1
            return duration_days * daily_rate

    def update_location_progress(self, location_id: int):
        """Atualiza o progresso de uma locação"""
        project_location = self.get_project_location(location_id)
        if project_location:
            project_location.update_completion_percentage()
            self.db.commit()
