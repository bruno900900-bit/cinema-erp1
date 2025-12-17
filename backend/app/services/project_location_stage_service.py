from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, asc
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from ..models.project_location_stage import ProjectLocationStage, LocationStageType, StageStatus
from ..models.project_location_stage_history import ProjectLocationStageHistory
from ..models.project_location import ProjectLocation
from ..models.user import User
from ..schemas.project_location_stage import (
    ProjectLocationStageCreate,
    ProjectLocationStageUpdate,
    ProjectLocationStageFilter,
    ProjectLocationStageTemplate
)
import json

class ProjectLocationStageService:
    def __init__(self, db: Session):
        self.db = db

    def create_stage(self, stage_data: ProjectLocationStageCreate) -> ProjectLocationStage:
        """Cria uma nova etapa de locação"""
        stage = ProjectLocationStage(**stage_data.dict())
        self.db.add(stage)
        self.db.commit()
        self.db.refresh(stage)

        # Atualiza o progresso da locação
        self._update_location_progress(stage.project_location_id)

        return stage

    def get_stage(self, stage_id: int) -> Optional[ProjectLocationStage]:
        """Obtém uma etapa específica"""
        return self.db.query(ProjectLocationStage).options(
            joinedload(ProjectLocationStage.responsible_user),
            joinedload(ProjectLocationStage.coordinator_user),
            joinedload(ProjectLocationStage.project_location),
            joinedload(ProjectLocationStage.status_changed_by_user),
            joinedload(ProjectLocationStage.completion_changed_by_user)
        ).filter(ProjectLocationStage.id == stage_id).first()

    def get_stages_by_project_location(self, project_location_id: int) -> List[ProjectLocationStage]:
        """Obtém todas as etapas de uma locação específica"""
        return self.db.query(ProjectLocationStage).options(
            joinedload(ProjectLocationStage.responsible_user),
            joinedload(ProjectLocationStage.coordinator_user),
            joinedload(ProjectLocationStage.status_changed_by_user),
            joinedload(ProjectLocationStage.completion_changed_by_user)
        ).filter(ProjectLocationStage.project_location_id == project_location_id).order_by(
            ProjectLocationStage.planned_start_date.asc()
        ).all()

    def get_stages_by_project(self, project_id: int) -> List[ProjectLocationStage]:
        """Obtém todas as etapas de um projeto"""
        return self.db.query(ProjectLocationStage).options(
            joinedload(ProjectLocationStage.responsible_user),
            joinedload(ProjectLocationStage.coordinator_user),
            joinedload(ProjectLocationStage.project_location).joinedload(ProjectLocation.location),
            joinedload(ProjectLocationStage.status_changed_by_user),
            joinedload(ProjectLocationStage.completion_changed_by_user)
        ).join(ProjectLocation).filter(
            ProjectLocation.project_id == project_id
        ).order_by(
            ProjectLocationStage.planned_start_date.asc()
        ).all()

    def update_stage(self, stage_id: int, stage_data: ProjectLocationStageUpdate) -> Optional[ProjectLocationStage]:
        """Atualiza uma etapa"""
        stage = self.get_stage(stage_id)
        if not stage:
            return None

        update_data = stage_data.dict(exclude_unset=True)

        # Extrair modified_by_user_id para audit trail
        modified_by_user_id = update_data.pop('modified_by_user_id', None)

        # Se mudou o status para IN_PROGRESS, define a data de início
        if update_data.get('status') == StageStatus.IN_PROGRESS and not stage.actual_start_date:
            update_data['actual_start_date'] = datetime.now(timezone.utc)

        # Se mudou o status para COMPLETED, define a data de fim e 100% de conclusão
        if update_data.get('status') == StageStatus.COMPLETED:
            update_data['actual_end_date'] = datetime.now(timezone.utc)
            update_data['completion_percentage'] = 100.0

        # Audit trail: rastrear quem alterou o status
        if 'status' in update_data and update_data['status'] != stage.status:
            update_data['status_changed_at'] = datetime.now(timezone.utc)
            if modified_by_user_id:
                update_data['status_changed_by_user_id'] = modified_by_user_id

        # Audit trail: rastrear quem alterou o percentual de conclusão
        if 'completion_percentage' in update_data and update_data['completion_percentage'] != stage.completion_percentage:
            update_data['completion_changed_at'] = datetime.now(timezone.utc)
            if modified_by_user_id:
                update_data['completion_changed_by_user_id'] = modified_by_user_id

        for field, value in update_data.items():
            setattr(stage, field, value)

        self.db.commit()
        self.db.refresh(stage)

        # Atualiza o progresso da locação
        self._update_location_progress(stage.project_location_id)

        return stage

    def delete_stage(self, stage_id: int) -> bool:
        """Remove uma etapa"""
        stage = self.get_stage(stage_id)
        if not stage:
            return False

        project_location_id = stage.project_location_id
        self.db.delete(stage)
        self.db.commit()

        # Atualiza o progresso da locação
        self._update_location_progress(project_location_id)

        return True

    def update_stage_status(
        self,
        stage_id: int,
        new_status: StageStatus,
        user_id: int,
        notes: Optional[str] = None
    ) -> ProjectLocationStage:
        """Atualiza o status de uma etapa e registra no histórico"""
        stage = self.get_stage(stage_id)
        if not stage:
            raise ValueError(f"Etapa {stage_id} não encontrada")

        # Armazena valores anteriores
        previous_status = stage.status
        previous_completion = stage.completion_percentage

        # Atualiza o status
        stage.status = new_status
        stage.status_changed_at = datetime.now(timezone.utc)
        stage.status_changed_by_user_id = user_id

        # Atualiza completion_percentage baseado no novo status
        stage.completion_percentage = stage.calculate_completion_percentage()

        # Define datas automáticas
        if new_status == StageStatus.IN_PROGRESS and not stage.actual_start_date:
            stage.actual_start_date = datetime.now(timezone.utc)
        elif new_status == StageStatus.COMPLETED:
            stage.actual_end_date = datetime.now(timezone.utc)
            stage.completion_percentage = 100.0

        # Cria registro de histórico
        history_entry = ProjectLocationStageHistory(
            stage_id=stage_id,
            previous_status=previous_status if previous_status != new_status else None,
            new_status=new_status,
            previous_completion=previous_completion,
            new_completion=stage.completion_percentage,
            changed_by_user_id=user_id,
            change_notes=notes,
            changed_at=datetime.now(timezone.utc)
        )

        self.db.add(history_entry)
        self.db.commit()
        self.db.refresh(stage)

        # Atualiza o progresso da locação
        self._update_location_progress(stage.project_location_id)

        return stage

    def get_stage_history(self, stage_id: int) -> List[ProjectLocationStageHistory]:
        """Retorna o histórico completo de mudanças de uma etapa"""
        return self.db.query(ProjectLocationStageHistory).options(
            joinedload(ProjectLocationStageHistory.changed_by)
        ).filter(
            ProjectLocationStageHistory.stage_id == stage_id
        ).order_by(
            ProjectLocationStageHistory.changed_at.desc()
        ).all()

    def create_default_stages(self, project_location_id: int, templates: List[ProjectLocationStageTemplate] = None) -> List[ProjectLocationStage]:
        """Cria etapas padrão para uma locação"""
        if not templates:
            templates = self._get_default_templates()

        stages = []
        current_date = datetime.now(timezone.utc)

        for i, template in enumerate(templates):
            planned_start = current_date if i == 0 else None
            planned_end = None

            if template.default_duration_days > 0:
                planned_end = current_date.replace(hour=18, minute=0, second=0, microsecond=0)
                if planned_start:
                    planned_end = planned_start.replace(hour=18, minute=0, second=0, microsecond=0)

            stage_data = ProjectLocationStageCreate(
                project_location_id=project_location_id,
                stage_type=template.stage_type,
                title=template.title,
                description=template.description,
                planned_start_date=planned_start,
                planned_end_date=planned_end,
                weight=template.weight,
                is_milestone=template.is_milestone,
                is_critical=template.is_critical
            )

            stage = self.create_stage(stage_data)
            stages.append(stage)

            # Ajusta as datas das próximas etapas
            if planned_end:
                current_date = planned_end.replace(hour=9, minute=0, second=0, microsecond=0)

        return stages

    def get_stages_with_filters(self, filters: ProjectLocationStageFilter, skip: int = 0, limit: int = 100) -> List[ProjectLocationStage]:
        """Busca etapas com filtros"""
        query = self.db.query(ProjectLocationStage).options(
            joinedload(ProjectLocationStage.responsible_user),
            joinedload(ProjectLocationStage.coordinator_user),
            joinedload(ProjectLocationStage.project_location).joinedload(ProjectLocation.location)
        )

        # Aplicar filtros
        if filters.project_location_ids:
            query = query.filter(ProjectLocationStage.project_location_id.in_(filters.project_location_ids))

        if filters.stage_types:
            query = query.filter(ProjectLocationStage.stage_type.in_(filters.stage_types))

        if filters.status:
            query = query.filter(ProjectLocationStage.status.in_(filters.status))

        if filters.responsible_user_ids:
            query = query.filter(ProjectLocationStage.responsible_user_id.in_(filters.responsible_user_ids))

        if filters.is_overdue is not None:
            if filters.is_overdue:
                query = query.filter(
                    and_(
                        ProjectLocationStage.planned_end_date < datetime.now(timezone.utc),
                        ProjectLocationStage.status != StageStatus.COMPLETED
                    )
                )
            else:
                query = query.filter(
                    or_(
                        ProjectLocationStage.planned_end_date >= datetime.now(timezone.utc),
                        ProjectLocationStage.status == StageStatus.COMPLETED,
                        ProjectLocationStage.planned_end_date.is_(None)
                    )
                )

        if filters.is_critical is not None:
            query = query.filter(ProjectLocationStage.is_critical == filters.is_critical)

        if filters.date_from:
            query = query.filter(ProjectLocationStage.planned_start_date >= filters.date_from)

        if filters.date_to:
            query = query.filter(ProjectLocationStage.planned_end_date <= filters.date_to)

        return query.order_by(ProjectLocationStage.planned_start_date.asc()).offset(skip).limit(limit).all()

    def get_project_progress_summary(self, project_id: int) -> Dict[str, Any]:
        """Obtém resumo do progresso de um projeto"""
        stages = self.get_stages_by_project(project_id)

        total_stages = len(stages)
        completed_stages = len([s for s in stages if s.status == StageStatus.COMPLETED])
        in_progress_stages = len([s for s in stages if s.status == StageStatus.IN_PROGRESS])
        overdue_stages = len([s for s in stages if s.is_overdue])
        critical_stages = len([s for s in stages if s.is_critical])

        # Calcula progresso médio ponderado
        total_weight = sum(s.weight for s in stages)
        weighted_progress = sum(s.completion_percentage * s.weight for s in stages)
        overall_progress = (weighted_progress / total_weight) if total_weight > 0 else 0

        # Próximas etapas críticas
        upcoming_critical = [
            s for s in stages
            if s.is_critical and s.status == StageStatus.PENDING and s.planned_start_date
        ]
        upcoming_critical.sort(key=lambda x: x.planned_start_date or datetime.max.replace(tzinfo=timezone.utc))

        return {
            'total_stages': total_stages,
            'completed_stages': completed_stages,
            'in_progress_stages': in_progress_stages,
            'overdue_stages': overdue_stages,
            'critical_stages': critical_stages,
            'overall_progress': round(overall_progress, 2),
            'upcoming_critical_stages': upcoming_critical[:5],  # Próximas 5 etapas críticas
            'completion_rate': round((completed_stages / total_stages * 100), 2) if total_stages > 0 else 0
        }

    def _update_location_progress(self, project_location_id: int):
        """Atualiza o progresso de uma locação baseado nas etapas"""
        location = self.db.query(ProjectLocation).filter(ProjectLocation.id == project_location_id).first()
        if location:
            location.update_completion_percentage()
            self.db.commit()

    def _get_default_templates(self) -> List[ProjectLocationStageTemplate]:
        """Retorna templates padrão para etapas de locação"""
        return [
            ProjectLocationStageTemplate(
                stage_type=LocationStageType.VISITACAO,
                title="Visitação Inicial",
                description="Primeira visita ao local para avaliação geral",
                default_duration_days=1,
                weight=1.0,
                is_milestone=True,
                is_critical=True,
                default_responsible_role="coordinator"
            ),
            ProjectLocationStageTemplate(
                stage_type=LocationStageType.AVALIACAO_TECNICA,
                title="Avaliação Técnica",
                description="Avaliação técnica detalhada do local e equipamentos",
                default_duration_days=1,
                weight=1.5,
                is_milestone=False,
                is_critical=True,
                default_responsible_role="coordinator"
            ),
            ProjectLocationStageTemplate(
                stage_type=LocationStageType.APROVACAO_CLIENTE,
                title="Aprovação do Cliente",
                description="Apresentação do local para aprovação do cliente",
                default_duration_days=1,
                weight=2.0,
                is_milestone=True,
                is_critical=True,
                default_responsible_role="manager"
            ),
            ProjectLocationStageTemplate(
                stage_type=LocationStageType.NEGOCIACAO,
                title="Negociação",
                description="Negociação de preços e condições contratuais",
                default_duration_days=2,
                weight=2.0,
                is_milestone=False,
                is_critical=True,
                default_responsible_role="manager"
            ),
            ProjectLocationStageTemplate(
                stage_type=LocationStageType.CONTRATACAO,
                title="Contratação",
                description="Assinatura do contrato e formalização",
                default_duration_days=1,
                weight=1.5,
                is_milestone=True,
                is_critical=True,
                default_responsible_role="manager"
            ),
            ProjectLocationStageTemplate(
                stage_type=LocationStageType.PREPARACAO,
                title="Preparação",
                description="Preparação do local para a gravação",
                default_duration_days=1,
                weight=1.0,
                is_milestone=False,
                is_critical=False,
                default_responsible_role="coordinator"
            ),
            ProjectLocationStageTemplate(
                stage_type=LocationStageType.SETUP,
                title="Setup e Montagem",
                description="Montagem de equipamentos e configuração",
                default_duration_days=1,
                weight=1.0,
                is_milestone=False,
                is_critical=False,
                default_responsible_role="coordinator"
            ),
            ProjectLocationStageTemplate(
                stage_type=LocationStageType.GRAVACAO,
                title="Gravação/Filmagem",
                description="Período de gravação ou filmagem",
                default_duration_days=1,
                weight=3.0,
                is_milestone=True,
                is_critical=True,
                default_responsible_role="coordinator"
            ),
            ProjectLocationStageTemplate(
                stage_type=LocationStageType.DESMONTAGEM,
                title="Desmontagem",
                description="Desmontagem de equipamentos e limpeza",
                default_duration_days=1,
                weight=1.0,
                is_milestone=False,
                is_critical=False,
                default_responsible_role="coordinator"
            ),
            ProjectLocationStageTemplate(
                stage_type=LocationStageType.ENTREGA,
                title="Entrega Final",
                description="Entrega do local e finalização do processo",
                default_duration_days=1,
                weight=1.5,
                is_milestone=True,
                is_critical=True,
                default_responsible_role="coordinator"
            )
        ]
