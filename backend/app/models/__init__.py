from .base import Base
from .user import User, UserRole
# Temporariamente comentado para compatibilidade
# from .user_permission import UserPermission
from .project import Project, ProjectStatus
from .project_stage import ProjectStage, ProjectStageStatus, ProjectStageType, StageTask
from .project_task import ProjectTask, TaskStatus, TaskType
from .supplier import Supplier
from .location import Location, LocationStatus, SpaceType, SectorType
from .location_photo import LocationPhoto
from .tag import Tag, TagKind, LocationTag
from .project_tag import ProjectTag
from .contract import Contract, ContractStatus, ContractTemplate
from .presentation import Presentation, PresentationTheme, PresentationItem
from .notification import Notification, NotificationSettings
from .saved_filter import SavedFilter, FilterScope
from .custom_filter import CustomFilter, FilterScope as CustomFilterScope
from .audit_log import AuditLog, AuditAction
from .visit import Visit, VisitParticipant, VisitEtapa, VisitStatus
from .financial import FinancialMovement, BudgetAdjustment, MovementType, MovementStatus
from .project_location_stage import ProjectLocationStage, StageStatus, LocationStageType
from .project_location_stage_history import ProjectLocationStageHistory
from .project_location import ProjectLocation, RentalStatus
from .agenda_event import AgendaEvent, EventType, EventStatus
from .user_project import UserProject, ProjectAccessLevel
from .project_visit_location import ProjectVisitLocation, VisitLocationStatus
from .project_visit_photo import ProjectVisitPhoto, PhotoComment
from .project_visit_workflow import ProjectVisitWorkflowStage, WorkflowStageStatus
from .project_location_photo import ProjectLocationPhoto, ProjectLocationPhotoComment
from .location_demand import LocationDemand, DemandPriority, DemandStatus

__all__ = [
    "Base",
    "User", "UserRole",
    # "UserPermission",  # Temporariamente comentado
    "Project", "ProjectStatus",
    "ProjectStage", "ProjectStageStatus", "ProjectStageType",
    "ProjectTask", "TaskStatus", "TaskType",
    "Supplier",
    "Location", "LocationStatus", "SpaceType", "SectorType",
    "LocationPhoto",
    "Tag", "TagKind", "LocationTag",
    "ProjectTag",
    "Contract", "ContractStatus", "ContractTemplate",
    "Presentation", "PresentationTheme", "PresentationItem",
    "Notification", "NotificationSettings",
    "SavedFilter", "FilterScope",
    "CustomFilter", "CustomFilterScope",
    "AuditLog", "AuditAction",
    "Visit", "VisitParticipant", "VisitEtapa", "VisitStatus",
    "FinancialMovement", "BudgetAdjustment", "MovementType", "MovementStatus",
    "ProjectLocationStage", "StageStatus", "LocationStageType",
    "ProjectLocationStageHistory",
    "ProjectLocation", "RentalStatus",
    "AgendaEvent", "EventType", "EventStatus",
    "StageTask",
    "ProjectVisitLocation", "VisitLocationStatus",
    "ProjectVisitPhoto", "PhotoComment",
    "ProjectVisitWorkflowStage", "WorkflowStageStatus",
    "ProjectLocationPhoto", "ProjectLocationPhotoComment",
    "UserProject", "ProjectAccessLevel",
    "LocationDemand", "DemandPriority", "DemandStatus"
]
