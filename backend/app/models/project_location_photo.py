"""
Modelo para Fotos de Locações dentro de um Projeto.
Permite adicionar fotos específicas a uma ProjectLocation,
além das fotos herdadas da Location original.
"""
from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class ProjectLocationPhoto(Base, TimestampMixin):
    """
    Foto de uma locação dentro de um projeto.
    Diferente de LocationPhoto, esta é específica do contexto do projeto.
    """
    __tablename__ = "project_location_photos"
    __table_args__ = {'extend_existing': True}

    # Relacionamento com ProjectLocation
    project_location_id = Column(Integer, ForeignKey("project_locations.id", ondelete="CASCADE"), nullable=False)

    # Informações do arquivo
    filename = Column(String(255), nullable=True)
    original_filename = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)

    # Metadados
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    file_size = Column(Integer, nullable=True)  # em bytes
    mime_type = Column(String(100), nullable=True)

    # Descrição
    caption = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)

    # Quem fez upload
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Tags/categoria
    category = Column(String(50), nullable=True)  # 'visit', 'technical', 'filming', 'delivery', etc.

    # Relacionamentos
    project_location = relationship("ProjectLocation", back_populates="project_photos")
    uploaded_by_user = relationship("User", foreign_keys=[uploaded_by_user_id])

    def __repr__(self):
        return f"<ProjectLocationPhoto(id={self.id}, filename='{self.filename}')>"


class ProjectLocationPhotoComment(Base, TimestampMixin):
    """
    Comentário em uma foto de locação do projeto.
    """
    __tablename__ = "project_location_photo_comments"
    __table_args__ = {'extend_existing': True}

    # Relacionamentos
    photo_id = Column(Integer, ForeignKey("project_location_photos.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Conteúdo
    comment = Column(Text, nullable=False)

    # Relacionamentos
    photo = relationship("ProjectLocationPhoto", backref="comments")
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<ProjectLocationPhotoComment(id={self.id}, photo_id={self.photo_id})>"
