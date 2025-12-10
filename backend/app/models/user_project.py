from sqlalchemy import Column, Integer, String, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum


class ProjectAccessLevel(str, enum.Enum):
    VIEWER = "viewer"       # Apenas visualização
    EDITOR = "editor"       # Pode editar dados do projeto
    ADMIN = "admin"         # Acesso total ao projeto


class UserProject(Base, TimestampMixin):
    """Tabela de relacionamento para controlar acesso de usuários a projetos"""
    __tablename__ = "user_projects"
    __table_args__ = (
        UniqueConstraint('user_id', 'project_id', name='unique_user_project'),
        {'extend_existing': True}
    )

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    access_level = Column(Enum(ProjectAccessLevel), default=ProjectAccessLevel.VIEWER)

    # Relacionamentos
    user = relationship("User", backref="project_accesses")
    project = relationship("Project", backref="user_accesses")

    def __repr__(self):
        return f"<UserProject(user_id={self.user_id}, project_id={self.project_id}, access={self.access_level})>"
