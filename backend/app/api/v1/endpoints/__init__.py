from .visits import router as visits_router
from .projects import router as projects_router
from .locations import router as locations_router
from .users import router as users_router
from .setup import router as setup_router
from .tags import router as tags_router
from .notifications import router as notifications_router
from .custom_filters import router as custom_filters_router
from .project_locations import router as project_locations_router
from .project_location_stages import router as project_location_stages_router
from .project_visit_locations import router as project_visit_locations_router
from .project_stages import router as project_stages_router
from .location_demands import router as location_demands_router
from . import auth

__all__ = [
    "visits_router",
    "projects_router",
    "locations_router",
    "users_router",
    "setup_router",
    "tags_router",
    "notifications_router",
    "custom_filters_router",
    "project_locations_router",
    "project_location_stages_router",
    "project_visit_locations_router",
    "project_stages_router",
    "location_demands_router",
    "auth"
]
