from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class AuditAction(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    VIEW = "view"
    EXPORT = "export"
    LOGIN = "login"
    LOGOUT = "logout"
    PERMISSION_CHANGE = "permission_change"

class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_log"
    __table_args__ = {'extend_existing': True}

    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    entity = Column(String(100), nullable=False)  # Nome da entidade (Location, Project, etc.)
    entity_id = Column(Integer, nullable=True)  # ID da entidade afetada
    action = Column(Enum(AuditAction), nullable=False)

    # Dados antes e depois da mudança
    before_json = Column(JSON, nullable=True)
    after_json = Column(JSON, nullable=True)

    # Metadados adicionais
    ip_address = Column(String(45), nullable=True)  # IPv4 ou IPv6
    user_agent = Column(Text, nullable=True)
    session_id = Column(String(255), nullable=True)

    # Relacionamentos
    # Temporariamente comentado para compatibilidade
    # actor = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog(id={self.id}, actor={self.actor_user_id}, action='{self.action}', entity='{self.entity}')>"
