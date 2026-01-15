"""
Modelo para fotos de locações visitadas e comentários em fotos.
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class ProjectVisitPhoto(Base, TimestampMixin):
    """
    Foto de uma locação visitada.
    """
    __tablename__ = "project_visit_photos"
    __table_args__ = {'extend_existing': True}

    # Relacionamento com a locação visitada
    visit_location_id = Column(Integer, ForeignKey("project_visit_locations.id"), nullable=False)

    # Informações do arquivo
    filename = Column(String(255), nullable=True)
    original_filename = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)  # Caminho local
    url = Column(String(500), nullable=True)  # URL pública (cloud storage)
    thumbnail_url = Column(String(500), nullable=True)

    # Metadados da imagem
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    file_size = Column(Integer, nullable=True)  # Bytes
    mime_type = Column(String(50), nullable=True)

    # Informações adicionais
    caption = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)

    # Quem fez o upload
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relacionamentos
    visit_location = relationship("ProjectVisitLocation", back_populates="photos")
    uploaded_by_user = relationship("User", foreign_keys=[uploaded_by_user_id])
    comments = relationship("PhotoComment", back_populates="photo", cascade="all, delete-orphan", order_by="PhotoComment.created_at")

    def __repr__(self):
        return f"<ProjectVisitPhoto(id={self.id}, visit_location_id={self.visit_location_id})>"

    @property
    def comments_count(self) -> int:
        """Retorna o número de comentários"""
        return len(self.comments) if self.comments else 0


class PhotoComment(Base, TimestampMixin):
    """
    Comentário em uma foto de locação visitada.
    Registra quem comentou e quando.
    """
    __tablename__ = "photo_comments"
    __table_args__ = {'extend_existing': True}

    # Relacionamento com a foto
    photo_id = Column(Integer, ForeignKey("project_visit_photos.id"), nullable=False)

    # Quem comentou
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Conteúdo do comentário
    comment = Column(Text, nullable=False)

    # Relacionamentos
    photo = relationship("ProjectVisitPhoto", back_populates="comments")
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<PhotoComment(id={self.id}, photo_id={self.photo_id}, user_id={self.user_id})>"
