from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON, Float, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin

class LocationPhoto(Base, TimestampMixin):
    __tablename__ = "location_photos"
    __table_args__ = {'extend_existing': True}

    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)

    # Campos para armazenamento local
    filename = Column(String(255), nullable=False)  # Nome do arquivo
    original_filename = Column(String(255), nullable=False)  # Nome original
    file_path = Column(String(500), nullable=False)  # Caminho do arquivo
    thumbnail_path = Column(String(500), nullable=True)  # Caminho da miniatura

    # Campos para armazenamento em nuvem (futuro)
    url = Column(String(500), nullable=True)  # URL pública da imagem
    storage_key = Column(String(500), nullable=True)  # Chave no storage (S3/R2)

    # Metadados da imagem
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    file_size = Column(Integer, nullable=True)  # Tamanho em bytes
    exif_json = Column(JSON, nullable=True)  # Metadados EXIF
    caption = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)  # Ordem de exibição
    is_primary = Column(Boolean, default=False)  # Foto principal

    # Relacionamentos
    location = relationship("Location", back_populates="photos")

    def __repr__(self):
        return f"<LocationPhoto(id={self.id}, location_id={self.location_id}, filename='{self.filename}')>"
