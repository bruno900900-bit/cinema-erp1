"""
Service para gerenciar locações visitadas em projetos.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, timezone

from ..models.project_visit_location import ProjectVisitLocation, VisitLocationStatus
from ..models.project_visit_photo import ProjectVisitPhoto, PhotoComment
from ..models.project_visit_workflow import ProjectVisitWorkflowStage, WorkflowStageStatus
from ..schemas.project_visit_location import (
    VisitLocationCreate,
    VisitLocationUpdate,
    VisitPhotoCreate,
    PhotoCommentCreate,
    WorkflowStageCreate,
    WorkflowStageUpdate,
)


class ProjectVisitLocationService:
    """Service para operações CRUD de locações visitadas"""

    def __init__(self, db: Session):
        self.db = db

    # ========== Visit Locations ==========

    def create_visit_location(self, data: VisitLocationCreate) -> ProjectVisitLocation:
        """Cria uma nova locação visitada"""
        location = ProjectVisitLocation(
            project_id=data.project_id,
            name=data.name,
            description=data.description,
            address=data.address,
            neighborhood=data.neighborhood,
            city=data.city,
            state=data.state,
            postal_code=data.postal_code,
            geo_coordinates=data.geo_coordinates,
            contact_name=data.contact_name,
            contact_phone=data.contact_phone,
            contact_email=data.contact_email,
            status=data.status,
            visit_date=data.visit_date,
            next_visit_date=data.next_visit_date,
            responsible_user_id=data.responsible_user_id,
            rating=data.rating,
            notes=data.notes,
            pros=data.pros,
            cons=data.cons,
            estimated_daily_rate=data.estimated_daily_rate,
            estimated_total_cost=data.estimated_total_cost,
            currency=data.currency,
            cover_photo_url=data.cover_photo_url,
        )
        self.db.add(location)
        self.db.commit()
        self.db.refresh(location)
        return location

    def get_visit_location(self, location_id: int) -> Optional[ProjectVisitLocation]:
        """Obtém uma locação visitada por ID"""
        return (
            self.db.query(ProjectVisitLocation)
            .options(
                joinedload(ProjectVisitLocation.responsible_user),
                joinedload(ProjectVisitLocation.photos).joinedload(ProjectVisitPhoto.comments).joinedload(PhotoComment.user),
                joinedload(ProjectVisitLocation.photos).joinedload(ProjectVisitPhoto.uploaded_by_user),
                joinedload(ProjectVisitLocation.workflow_stages).joinedload(ProjectVisitWorkflowStage.responsible_user),
                joinedload(ProjectVisitLocation.workflow_stages).joinedload(ProjectVisitWorkflowStage.completed_by_user),
            )
            .filter(ProjectVisitLocation.id == location_id)
            .first()
        )

    def get_visit_locations_by_project(self, project_id: int) -> List[ProjectVisitLocation]:
        """Lista todas as locações visitadas de um projeto"""
        return (
            self.db.query(ProjectVisitLocation)
            .options(
                joinedload(ProjectVisitLocation.responsible_user),
                joinedload(ProjectVisitLocation.photos),
                joinedload(ProjectVisitLocation.workflow_stages),
            )
            .filter(ProjectVisitLocation.project_id == project_id)
            .order_by(ProjectVisitLocation.created_at.desc())
            .all()
        )

    def update_visit_location(
        self, location_id: int, data: VisitLocationUpdate
    ) -> Optional[ProjectVisitLocation]:
        """Atualiza uma locação visitada"""
        location = self.db.query(ProjectVisitLocation).filter(
            ProjectVisitLocation.id == location_id
        ).first()

        if not location:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(location, field, value)

        self.db.commit()
        self.db.refresh(location)
        return location

    def delete_visit_location(self, location_id: int) -> bool:
        """Remove uma locação visitada"""
        location = self.db.query(ProjectVisitLocation).filter(
            ProjectVisitLocation.id == location_id
        ).first()

        if not location:
            return False

        self.db.delete(location)
        self.db.commit()
        return True

    # ========== Photos ==========

    def add_photo(self, data: VisitPhotoCreate) -> ProjectVisitPhoto:
        """Adiciona uma foto à locação visitada"""
        photo = ProjectVisitPhoto(
            visit_location_id=data.visit_location_id,
            filename=data.filename,
            original_filename=data.original_filename,
            file_path=data.file_path,
            url=data.url,
            caption=data.caption,
            sort_order=data.sort_order,
            uploaded_by_user_id=data.uploaded_by_user_id,
        )
        self.db.add(photo)
        self.db.commit()
        self.db.refresh(photo)
        return photo

    def get_photo(self, photo_id: int) -> Optional[ProjectVisitPhoto]:
        """Obtém uma foto por ID"""
        return (
            self.db.query(ProjectVisitPhoto)
            .options(
                joinedload(ProjectVisitPhoto.comments).joinedload(PhotoComment.user),
                joinedload(ProjectVisitPhoto.uploaded_by_user),
            )
            .filter(ProjectVisitPhoto.id == photo_id)
            .first()
        )

    def get_photos_by_location(self, location_id: int) -> List[ProjectVisitPhoto]:
        """Lista fotos de uma locação"""
        return (
            self.db.query(ProjectVisitPhoto)
            .options(
                joinedload(ProjectVisitPhoto.comments).joinedload(PhotoComment.user),
                joinedload(ProjectVisitPhoto.uploaded_by_user),
            )
            .filter(ProjectVisitPhoto.visit_location_id == location_id)
            .order_by(ProjectVisitPhoto.sort_order)
            .all()
        )

    def delete_photo(self, photo_id: int) -> bool:
        """Remove uma foto"""
        photo = self.db.query(ProjectVisitPhoto).filter(
            ProjectVisitPhoto.id == photo_id
        ).first()

        if not photo:
            return False

        self.db.delete(photo)
        self.db.commit()
        return True

    def update_photo_caption(self, photo_id: int, caption: str) -> Optional[ProjectVisitPhoto]:
        """Atualiza a legenda de uma foto"""
        photo = self.db.query(ProjectVisitPhoto).filter(
            ProjectVisitPhoto.id == photo_id
        ).first()

        if not photo:
            return None

        photo.caption = caption
        self.db.commit()
        self.db.refresh(photo)
        return photo

    # ========== Comments ==========

    def add_comment(self, data: PhotoCommentCreate) -> PhotoComment:
        """Adiciona um comentário a uma foto"""
        comment = PhotoComment(
            photo_id=data.photo_id,
            user_id=data.user_id,
            comment=data.comment,
        )
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def get_comments_by_photo(self, photo_id: int) -> List[PhotoComment]:
        """Lista comentários de uma foto"""
        return (
            self.db.query(PhotoComment)
            .options(joinedload(PhotoComment.user))
            .filter(PhotoComment.photo_id == photo_id)
            .order_by(PhotoComment.created_at)
            .all()
        )

    def delete_comment(self, comment_id: int) -> bool:
        """Remove um comentário"""
        comment = self.db.query(PhotoComment).filter(
            PhotoComment.id == comment_id
        ).first()

        if not comment:
            return False

        self.db.delete(comment)
        self.db.commit()
        return True

    # ========== Workflow Stages ==========

    def add_workflow_stage(self, data: WorkflowStageCreate) -> ProjectVisitWorkflowStage:
        """Adiciona uma etapa de workflow"""
        # Determina o próximo order_index
        max_order = (
            self.db.query(ProjectVisitWorkflowStage)
            .filter(ProjectVisitWorkflowStage.visit_location_id == data.visit_location_id)
            .count()
        )

        stage = ProjectVisitWorkflowStage(
            visit_location_id=data.visit_location_id,
            title=data.title,
            description=data.description,
            order_index=data.order_index if data.order_index > 0 else max_order,
            responsible_user_id=data.responsible_user_id,
            due_date=data.due_date,
            notes=data.notes,
        )
        self.db.add(stage)
        self.db.commit()
        self.db.refresh(stage)
        return stage

    def get_workflow_stages(self, location_id: int) -> List[ProjectVisitWorkflowStage]:
        """Lista etapas de workflow de uma locação"""
        return (
            self.db.query(ProjectVisitWorkflowStage)
            .options(
                joinedload(ProjectVisitWorkflowStage.responsible_user),
                joinedload(ProjectVisitWorkflowStage.completed_by_user),
            )
            .filter(ProjectVisitWorkflowStage.visit_location_id == location_id)
            .order_by(ProjectVisitWorkflowStage.order_index)
            .all()
        )

    def update_workflow_stage(
        self, stage_id: int, data: WorkflowStageUpdate, user_id: Optional[int] = None
    ) -> Optional[ProjectVisitWorkflowStage]:
        """Atualiza uma etapa de workflow"""
        stage = self.db.query(ProjectVisitWorkflowStage).filter(
            ProjectVisitWorkflowStage.id == stage_id
        ).first()

        if not stage:
            return None

        update_data = data.model_dump(exclude_unset=True)

        # Tratar mudanças de status
        if 'status' in update_data:
            new_status = update_data['status']
            if new_status == WorkflowStageStatus.COMPLETED and stage.status != WorkflowStageStatus.COMPLETED:
                stage.completed_at = datetime.now(timezone.utc)
                stage.completed_by_user_id = user_id
            elif new_status == WorkflowStageStatus.IN_PROGRESS and stage.status == WorkflowStageStatus.PENDING:
                stage.started_at = datetime.now(timezone.utc)

        for field, value in update_data.items():
            setattr(stage, field, value)

        self.db.commit()
        self.db.refresh(stage)
        return stage

    def delete_workflow_stage(self, stage_id: int) -> bool:
        """Remove uma etapa de workflow"""
        stage = self.db.query(ProjectVisitWorkflowStage).filter(
            ProjectVisitWorkflowStage.id == stage_id
        ).first()

        if not stage:
            return False

        self.db.delete(stage)
        self.db.commit()
        return True

    def reorder_stages(self, location_id: int, stage_ids: List[int]) -> List[ProjectVisitWorkflowStage]:
        """Reordena as etapas de workflow"""
        for index, stage_id in enumerate(stage_ids):
            stage = self.db.query(ProjectVisitWorkflowStage).filter(
                and_(
                    ProjectVisitWorkflowStage.id == stage_id,
                    ProjectVisitWorkflowStage.visit_location_id == location_id,
                )
            ).first()
            if stage:
                stage.order_index = index

        self.db.commit()
        return self.get_workflow_stages(location_id)
