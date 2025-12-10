from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin

class ProjectTag(Base, TimestampMixin):
    __tablename__ = "project_tags"
    __table_args__ = {'extend_existing': True}

    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="project_tags")
    tag = relationship("Tag", back_populates="project_tags")

    def __repr__(self):
        return f"<ProjectTag(project_id={self.project_id}, tag_id={self.tag_id})>"
