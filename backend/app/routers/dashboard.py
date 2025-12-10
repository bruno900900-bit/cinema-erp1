"""
Dashboard endpoints - KPIs e métricas para produtora de locação
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from typing import List, Optional

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.project import Project, ProjectStatus
from app.models.location import Location, LocationStatus
from app.models.project_location import ProjectLocation
from app.models.agenda_event import AgendaEvent
from app.models.financial import FinancialMovement

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retorna KPIs gerais do dashboard"""
    today = datetime.now().date()
    start_of_month = today.replace(day=1)

    # Total de projetos
    total_projects = db.query(func.count(Project.id)).scalar() or 0

    # Projetos ativos
    active_projects = db.query(func.count(Project.id)).filter(
        Project.status == ProjectStatus.ACTIVE
    ).scalar() or 0

    # Total de locações
    total_locations = db.query(func.count(Location.id)).scalar() or 0

    # Locações aprovadas
    approved_locations = db.query(func.count(Location.id)).filter(
        Location.status == LocationStatus.APPROVED
    ).scalar() or 0

    # Orçamento total de projetos ativos
    total_budget = db.query(func.coalesce(func.sum(Project.budget_total), 0)).filter(
        Project.status == ProjectStatus.ACTIVE
    ).scalar() or 0

    # Orçamento gasto
    budget_spent = db.query(func.coalesce(func.sum(Project.budget_spent), 0)).filter(
        Project.status == ProjectStatus.ACTIVE
    ).scalar() or 0

    # Eventos dos próximos 7 dias
    next_week = today + timedelta(days=7)
    upcoming_events = db.query(func.count(AgendaEvent.id)).filter(
        and_(
            AgendaEvent.event_date >= today,
            AgendaEvent.event_date <= next_week
        )
    ).scalar() or 0

    # Usuários ativos
    active_users = db.query(func.count(User.id)).filter(
        User.is_active == True
    ).scalar() or 0

    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "total_locations": total_locations,
        "approved_locations": approved_locations,
        "total_budget": float(total_budget),
        "budget_spent": float(budget_spent),
        "budget_remaining": float(total_budget - budget_spent),
        "upcoming_events": upcoming_events,
        "active_users": active_users,
    }


@router.get("/projects")
def get_active_projects(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retorna projetos ativos com resumo"""
    projects = db.query(Project).filter(
        Project.status == ProjectStatus.ACTIVE
    ).order_by(Project.updated_at.desc()).limit(limit).all()

    result = []
    for p in projects:
        # Contar locações do projeto
        location_count = db.query(func.count(ProjectLocation.id)).filter(
            ProjectLocation.project_id == p.id
        ).scalar() or 0

        result.append({
            "id": p.id,
            "name": p.name or p.title,
            "client_name": p.client_name,
            "status": p.status.value if p.status else None,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "end_date": p.end_date.isoformat() if p.end_date else None,
            "budget_total": float(p.budget_total or 0),
            "budget_spent": float(p.budget_spent or 0),
            "budget_progress": round((p.budget_spent or 0) / (p.budget_total or 1) * 100, 1),
            "location_count": location_count,
        })

    return {"projects": result}


@router.get("/upcoming-events")
def get_upcoming_events(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retorna próximos eventos da agenda"""
    today = datetime.now().date()
    next_month = today + timedelta(days=30)

    events = db.query(AgendaEvent).filter(
        and_(
            AgendaEvent.event_date >= today,
            AgendaEvent.event_date <= next_month
        )
    ).order_by(AgendaEvent.event_date.asc()).limit(limit).all()

    result = []
    for e in events:
        result.append({
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "event_type": e.event_type.value if e.event_type else None,
            "status": e.status.value if e.status else None,
            "event_date": e.event_date.isoformat() if e.event_date else None,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "is_all_day": e.is_all_day,
            "color": e.color,
            "priority": e.priority,
        })

    return {"events": result}


@router.get("/recent-locations")
def get_recent_locations(
    limit: int = 6,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retorna locações recentes com foto de capa"""
    locations = db.query(Location).order_by(
        Location.updated_at.desc()
    ).limit(limit).all()

    result = []
    for loc in locations:
        result.append({
            "id": loc.id,
            "title": loc.title,
            "city": loc.city,
            "state": loc.state,
            "status": loc.status.value if loc.status else None,
            "cover_photo_url": loc.cover_photo_url,
            "space_type": loc.space_type.value if loc.space_type else None,
            "price_day_cinema": float(loc.price_day_cinema or 0),
        })

    return {"locations": result}


@router.get("/financial-summary")
def get_financial_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retorna resumo financeiro"""
    today = datetime.now().date()
    start_of_month = today.replace(day=1)
    start_of_year = today.replace(month=1, day=1)

    # Orçamento total de todos os projetos ativos
    total_budget = db.query(func.coalesce(func.sum(Project.budget_total), 0)).filter(
        Project.status == ProjectStatus.ACTIVE
    ).scalar() or 0

    # Total gasto
    total_spent = db.query(func.coalesce(func.sum(Project.budget_spent), 0)).filter(
        Project.status == ProjectStatus.ACTIVE
    ).scalar() or 0

    # Projetos por status de orçamento
    projects_over_budget = db.query(func.count(Project.id)).filter(
        and_(
            Project.status == ProjectStatus.ACTIVE,
            Project.budget_spent > Project.budget_total
        )
    ).scalar() or 0

    # Top 5 projetos por orçamento
    top_projects = db.query(Project).filter(
        Project.status == ProjectStatus.ACTIVE
    ).order_by(Project.budget_total.desc()).limit(5).all()

    return {
        "total_budget": float(total_budget),
        "total_spent": float(total_spent),
        "remaining": float(total_budget - total_spent),
        "utilization_percent": round(total_spent / (total_budget or 1) * 100, 1),
        "projects_over_budget": projects_over_budget,
        "top_projects_by_budget": [
            {
                "id": p.id,
                "name": p.name or p.title,
                "budget_total": float(p.budget_total or 0),
                "budget_spent": float(p.budget_spent or 0),
                "remaining": float((p.budget_total or 0) - (p.budget_spent or 0)),
            }
            for p in top_projects
        ]
    }
