from sqlalchemy import Column, String, Text, Enum, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class TagKind(str, enum.Enum):
    FEATURE = "feature"      # Características físicas
    STYLE = "style"          # Estilo visual
    LIGHTING = "lighting"    # Iluminação
    PERIOD = "period"        # Período histórico
    AMENITY = "amenity"      # Comodidades
    CUSTOM = "custom"        # Personalizado

class Tag(Base, TimestampMixin):
    __tablename__ = "tags"
    __table_args__ = {'extend_existing': True}

    name = Column(String(100), nullable=False, unique=True)
    kind = Column(Enum(TagKind), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=True)  # Hex color (#FFFFFF)

    # Relacionamentos
    location_tags = relationship("LocationTag", back_populates="tag")
    project_tags = relationship("ProjectTag", back_populates="tag")

    def __repr__(self):
        return f"<Tag(id={self.id}, name='{self.name}', kind='{self.kind}')>"

class LocationTag(Base, TimestampMixin):
    __tablename__ = "location_tags"
    __table_args__ = {'extend_existing': True}

    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=False)

    # Relacionamentos
    location = relationship("Location", back_populates="location_tags")
    tag = relationship("Tag", back_populates="location_tags")

    def __repr__(self):
        return f"<LocationTag(location_id={self.location_id}, tag_id={self.tag_id})>"
