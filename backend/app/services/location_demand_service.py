from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Tuple
from datetime import datetime, timezone

from ..models.location_demand import LocationDemand, DemandPriority, DemandStatus
from ..models.agenda_event import AgendaEvent, EventType, EventStatus
from ..schemas.location_demand import (
    LocationDemandCreate,
    LocationDemandUpdate,
    LocationDemandFilter,
    LocationDemandSummary
)


class LocationDemandService:
    """Service for managing location demands"""

    def __init__(self, db: Session):
        self.db = db

    def create_demand(
        self,
        demand_data: LocationDemandCreate,
        created_by_user_id: int
    ) -> LocationDemand:
        """Create a new demand and optionally create agenda event"""
        db_demand = LocationDemand(
            **demand_data.model_dump(exclude={'attachments_json'}),
            created_by_user_id=created_by_user_id,
            attachments_json=demand_data.attachments_json
        )
        self.db.add(db_demand)
        self.db.commit()
        self.db.refresh(db_demand)

        # Create agenda event if due_date is set
        if db_demand.due_date:
            self._create_or_update_agenda_event(db_demand)

        return db_demand

    def get_demand(self, demand_id: int) -> Optional[LocationDemand]:
        """Get a demand by ID"""
        return self.db.query(LocationDemand).filter(LocationDemand.id == demand_id).first()

    def get_demands(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[LocationDemandFilter] = None
    ) -> Tuple[List[LocationDemand], int]:
        """Get demands with filters and pagination"""
        query = self.db.query(LocationDemand)

        if filters:
            if filters.project_id:
                query = query.filter(LocationDemand.project_id == filters.project_id)
            if filters.project_location_id:
                query = query.filter(LocationDemand.project_location_id == filters.project_location_id)
            if filters.status:
                query = query.filter(LocationDemand.status == filters.status)
            if filters.priority:
                query = query.filter(LocationDemand.priority == filters.priority)
            if filters.assigned_user_id:
                query = query.filter(LocationDemand.assigned_user_id == filters.assigned_user_id)
            if filters.category:
                query = query.filter(LocationDemand.category == filters.category)
            if filters.due_date_from:
                query = query.filter(LocationDemand.due_date >= filters.due_date_from)
            if filters.due_date_to:
                query = query.filter(LocationDemand.due_date <= filters.due_date_to)
            if filters.overdue_only:
                now = datetime.now(timezone.utc)
                query = query.filter(
                    and_(
                        LocationDemand.due_date < now,
                        LocationDemand.status != DemandStatus.COMPLETED,
                        LocationDemand.status != DemandStatus.CANCELLED
                    )
                )

        # Count total before pagination
        total = query.count()

        # Order by priority (urgent first) then by due_date
        query = query.order_by(
            LocationDemand.priority.desc(),
            LocationDemand.due_date.asc().nullslast()
        )

        demands = query.offset(skip).limit(limit).all()
        return demands, total

    def get_demands_by_location(self, project_location_id: int) -> List[LocationDemand]:
        """Get all demands for a specific location"""
        return self.db.query(LocationDemand).filter(
            LocationDemand.project_location_id == project_location_id
        ).order_by(
            LocationDemand.priority.desc(),
            LocationDemand.due_date.asc().nullslast()
        ).all()

    def get_demands_by_project(self, project_id: int) -> List[LocationDemand]:
        """Get all demands for a project"""
        return self.db.query(LocationDemand).filter(
            LocationDemand.project_id == project_id
        ).order_by(
            LocationDemand.priority.desc(),
            LocationDemand.due_date.asc().nullslast()
        ).all()

    def update_demand(
        self,
        demand_id: int,
        demand_data: LocationDemandUpdate
    ) -> Optional[LocationDemand]:
        """Update an existing demand"""
        db_demand = self.get_demand(demand_id)
        if not db_demand:
            return None

        update_data = demand_data.model_dump(exclude_unset=True)

        # Track if status changed to completed
        status_changed_to_completed = (
            'status' in update_data and
            update_data['status'] == DemandStatus.COMPLETED and
            db_demand.status != DemandStatus.COMPLETED
        )

        for field, value in update_data.items():
            setattr(db_demand, field, value)

        # Set completed_at if completed
        if status_changed_to_completed:
            db_demand.completed_at = datetime.now(timezone.utc)

        # Update or create agenda event if due_date changed
        if 'due_date' in update_data:
            self._create_or_update_agenda_event(db_demand)

        self.db.commit()
        self.db.refresh(db_demand)
        return db_demand

    def delete_demand(self, demand_id: int) -> bool:
        """Delete a demand and its associated agenda event"""
        db_demand = self.get_demand(demand_id)
        if not db_demand:
            return False

        # Delete associated agenda event if exists
        if db_demand.agenda_event_id:
            agenda_event = self.db.query(AgendaEvent).filter(
                AgendaEvent.id == db_demand.agenda_event_id
            ).first()
            if agenda_event:
                self.db.delete(agenda_event)

        self.db.delete(db_demand)
        self.db.commit()
        return True

    def get_summary(
        self,
        project_id: Optional[int] = None,
        project_location_id: Optional[int] = None
    ) -> LocationDemandSummary:
        """Get summary statistics for demands"""
        query = self.db.query(LocationDemand)

        if project_id:
            query = query.filter(LocationDemand.project_id == project_id)
        if project_location_id:
            query = query.filter(LocationDemand.project_location_id == project_location_id)

        demands = query.all()

        now = datetime.now(timezone.utc)

        summary = LocationDemandSummary(
            total=len(demands),
            pending=sum(1 for d in demands if d.status == DemandStatus.PENDING),
            in_progress=sum(1 for d in demands if d.status == DemandStatus.IN_PROGRESS),
            completed=sum(1 for d in demands if d.status == DemandStatus.COMPLETED),
            overdue=sum(1 for d in demands if d.is_overdue),
            by_priority={
                'low': sum(1 for d in demands if d.priority == DemandPriority.LOW),
                'medium': sum(1 for d in demands if d.priority == DemandPriority.MEDIUM),
                'high': sum(1 for d in demands if d.priority == DemandPriority.HIGH),
                'urgent': sum(1 for d in demands if d.priority == DemandPriority.URGENT),
            }
        )

        return summary

    def _create_or_update_agenda_event(self, demand: LocationDemand) -> None:
        """Create or update agenda event for a demand"""
        if not demand.due_date:
            # Remove event if due_date is cleared
            if demand.agenda_event_id:
                agenda_event = self.db.query(AgendaEvent).filter(
                    AgendaEvent.id == demand.agenda_event_id
                ).first()
                if agenda_event:
                    self.db.delete(agenda_event)
                demand.agenda_event_id = None
            return

        # Determine color based on priority
        priority_colors = {
            DemandPriority.LOW: "#4CAF50",      # Green
            DemandPriority.MEDIUM: "#FFC107",   # Yellow
            DemandPriority.HIGH: "#FF9800",     # Orange
            DemandPriority.URGENT: "#F44336",   # Red
        }

        event_data = {
            'title': f"📋 Demanda: {demand.title}",
            'description': demand.description or f"Vencimento da demanda: {demand.title}",
            'event_type': EventType.CUSTOM,
            'status': EventStatus.SCHEDULED if demand.status != DemandStatus.COMPLETED else EventStatus.COMPLETED,
            'start_date': demand.due_date.isoformat() if demand.due_date else None,
            'all_day': True,
            'project_id': demand.project_id,
            'project_location_id': demand.project_location_id,
            'color': priority_colors.get(demand.priority, "#2196F3"),
            'priority': {
                DemandPriority.LOW: 1,
                DemandPriority.MEDIUM: 2,
                DemandPriority.HIGH: 3,
                DemandPriority.URGENT: 3,
            }.get(demand.priority, 2),
            'metadata_json': {
                'demand_id': demand.id,
                'category': demand.category,
                'assigned_user_id': demand.assigned_user_id,
            }
        }

        if demand.agenda_event_id:
            # Update existing event
            agenda_event = self.db.query(AgendaEvent).filter(
                AgendaEvent.id == demand.agenda_event_id
            ).first()
            if agenda_event:
                for field, value in event_data.items():
                    setattr(agenda_event, field, value)
        else:
            # Create new event
            agenda_event = AgendaEvent(**event_data)
            self.db.add(agenda_event)
            self.db.flush()  # Get the ID before commit
            demand.agenda_event_id = agenda_event.id
