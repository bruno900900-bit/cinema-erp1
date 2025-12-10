from sqlalchemy import Column, String, Text, Enum, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class TaskType(str, enum.Enum):
    PREPARATION = "preparation"
    SETUP = "setup"
    MONITORING = "monitoring"
    CLEANUP = "cleanup"
    INSPECTION = "inspection"
    RETURN = "return"
    RESEARCH = "research"
    PREPRODUCTION = "preproduction"
    FILMING = "filming"
    DEVELOPMENT = "development"

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ProjectTask(Base, TimestampMixin):
    __tablename__ = "project_tasks"
    __table_args__ = {'extend_existing': True}

    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(Enum(TaskType), default=TaskType.PREPARATION)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assigned_to])

    def __repr__(self):
        return f"<ProjectTask(id={self.id}, title='{self.title}', status='{self.status}')>"
