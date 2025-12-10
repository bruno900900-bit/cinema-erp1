from sqlalchemy import Column, String, Text, Enum, Integer, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class NotificationType(str, enum.Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"

class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"
    __table_args__ = {'extend_existing': True}

    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Enum(NotificationType), nullable=False, default=NotificationType.INFO)
    is_read = Column(Boolean, default=False)

    # Relacionamento com usuário
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Campos opcionais para ações
    action_url = Column(String(500), nullable=True)
    action_text = Column(String(100), nullable=True)

    # Data de leitura
    read_at = Column(DateTime, nullable=True)

    # Relacionamentos
    user = relationship("app.models.user.User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification(id={self.id}, title='{self.title}', type='{self.type}', is_read={self.is_read})>"

class NotificationSettings(Base, TimestampMixin):
    __tablename__ = "notification_settings"
    __table_args__ = {'extend_existing': True}

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # Configurações de notificação
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)

    # Tipos de notificação habilitados
    notification_types = Column(String(500), default="info,success,warning,error")  # JSON string

    # Relacionamentos
    user = relationship("app.models.user.User", back_populates="notification_settings")

    def __repr__(self):
        return f"<NotificationSettings(user_id={self.user_id}, email={self.email_notifications}, push={self.push_notifications})>"
