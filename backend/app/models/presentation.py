from sqlalchemy import Column, String, Text, Integer, ForeignKey, Enum, JSON, DateTime, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class PresentationTheme(str, enum.Enum):
    LIGHT = "light"
    DARK = "dark"
    BRAND = "brand"

class Presentation(Base, TimestampMixin):
    __tablename__ = "presentations"
    __table_args__ = {'extend_existing': True}

    name = Column(String(255), nullable=False)
    criteria_json = Column(JSON, nullable=False)  # Critérios do filtro usado
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Token público e segurança
    token = Column(String(100), nullable=True, unique=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    password_hash = Column(String(255), nullable=True)  # Senha opcional

    # Configuração visual
    theme = Column(Enum(PresentationTheme), default=PresentationTheme.LIGHT)
    watermark_text = Column(String(255), nullable=True)
    logo_url = Column(String(500), nullable=True)

    # Arquivos gerados
    pdf_url = Column(String(500), nullable=True)
    is_public = Column(Boolean, default=False)

    # Relacionamentos
    # Temporariamente comentado para compatibilidade
    # generated_by_user = relationship("User", back_populates="generated_presentations")
    items = relationship("PresentationItem", back_populates="presentation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Presentation(id={self.id}, name='{self.name}', theme='{self.theme}')>"

class PresentationItem(Base, TimestampMixin):
    __tablename__ = "presentation_items"
    __table_args__ = {'extend_existing': True}

    presentation_id = Column(Integer, ForeignKey("presentations.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    sort_order = Column(Integer, default=0)
    note = Column(Text, nullable=True)  # Nota específica para este item

    # Relacionamentos
    presentation = relationship("Presentation", back_populates="items")
    location = relationship("Location", back_populates="presentation_items")

    def __repr__(self):
        return f"<PresentationItem(id={self.id}, presentation_id={self.presentation_id}, location_id={self.location_id})>"
