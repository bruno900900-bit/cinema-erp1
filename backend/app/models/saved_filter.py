from sqlalchemy import Column, String, Text, Integer, ForeignKey, Enum, JSON, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class FilterScope(str, enum.Enum):
    PRIVATE = "private"    # Apenas para o usuário
    TEAM = "team"          # Para toda a equipe
    PUBLIC = "public"      # Público para todos

class SavedFilter(Base, TimestampMixin):
    __tablename__ = "saved_filters"
    __table_args__ = {'extend_existing': True}

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scope = Column(Enum(FilterScope), default=FilterScope.PRIVATE)

    # Critérios do filtro
    criteria_json = Column(JSON, nullable=False)

    # Configurações
    is_default = Column(Boolean, default=False)  # Filtro padrão
    sort_order = Column(Integer, default=0)

    # Relacionamentos
    # Temporariamente comentado para compatibilidade
    # owner = relationship("User", back_populates="saved_filters")

    def __repr__(self):
        return f"<SavedFilter(id={self.id}, name='{self.name}', scope='{self.scope}')>"
