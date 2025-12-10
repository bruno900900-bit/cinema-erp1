from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin

class UserPermission(Base, TimestampMixin):
    __tablename__ = "user_permissions"

    # Usuário
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Funcionalidade
    module = Column(String(50), nullable=False)  # locations, projects, visits, users, etc.
    action = Column(String(50), nullable=False)  # create, read, update, delete, manage

    # Permissões específicas
    can_read = Column(Boolean, default=True)
    can_create = Column(Boolean, default=False)
    can_update = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
    can_manage = Column(Boolean, default=False)

    # Restrições
    restrictions_json = Column(JSON, nullable=True)  # Filtros específicos (ex: apenas suas locações)

    # Relacionamentos
    # Temporariamente comentado para compatibilidade
    # user = relationship("User", back_populates="permissions")

    def __repr__(self):
        return f"<UserPermission(user_id={self.user_id}, module='{self.module}', action='{self.action}')>"
