from sqlalchemy import Column, String, Boolean, Text, Enum, JSON, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"           # Acesso total ao sistema
    MANAGER = "manager"       # Gerencia projetos e equipes
    COORDINATOR = "coordinator"  # Coordena visitas e locações
    OPERATOR = "operator"     # Operador de campo
    VIEWER = "viewer"         # Apenas visualização
    CLIENT = "client"         # Cliente externo (acesso limitado)
    CONTRIBUTOR = "contributor" # Novo usuário (sem acesso)

class User(Base, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    # Informações básicas
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)

    # RBAC
    role = Column(Enum(UserRole), default=UserRole.CONTRIBUTOR)
    is_active = Column(Boolean, default=True)

    # Perfil
    bio = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)

    # Configurações
    preferences_json = Column(JSON, nullable=True)  # Preferências do usuário
    permissions_json = Column(JSON, nullable=True)  # Permissões personalizadas por página/ação
    timezone = Column(String(50), default="America/Sao_Paulo")
    locale = Column(String(10), default="pt-BR")

    # Permissões específicas (temporariamente comentado para compatibilidade)
    # permissions_json = Column(JSON, nullable=True)  # Permissões detalhadas por funcionalidade

    # Informações de trabalho (temporariamente comentado para compatibilidade)
    # department = Column(String(100), nullable=True)  # Departamento
    # position = Column(String(100), nullable=True)    # Cargo
    # employee_id = Column(String(50), nullable=True)  # ID do funcionário
    # hire_date = Column(String(20), nullable=True)    # Data de contratação

    # Configurações de notificação (temporariamente comentado para compatibilidade)
    # email_notifications = Column(Boolean, default=True)
    # sms_notifications = Column(Boolean, default=False)
    # push_notifications = Column(Boolean, default=True)

    # Limitações de acesso (temporariamente comentado para compatibilidade)
    # can_create_projects = Column(Boolean, default=False)
    # can_manage_users = Column(Boolean, default=False)
    # can_view_financials = Column(Boolean, default=False)
    # can_export_data = Column(Boolean, default=False)

    # Relacionamentos necessários para notificações
    notifications = relationship("app.models.notification.Notification", back_populates="user")
    notification_settings = relationship("app.models.notification.NotificationSettings", back_populates="user", uselist=False)

    # Relacionamentos (temporariamente comentado para compatibilidade)
    # created_visits = relationship("Visit", back_populates="created_by_user", foreign_keys="Visit.created_by")
    # responsible_visits = relationship("Visit", back_populates="responsible_user", foreign_keys="Visit.responsible_user_id")
    # coordinated_visits = relationship("Visit", back_populates="coordinator_user", foreign_keys="Visit.coordinator_user_id")
    # visit_participations = relationship("VisitParticipant", back_populates="user")
    # responsible_locations = relationship("Location", back_populates="responsible_user", foreign_keys="Location.responsible_user_id")
    # managed_projects = relationship("Project", back_populates="manager_user", foreign_keys="Project.manager_id")
    # coordinated_projects = relationship("Project", back_populates="coordinator_user", foreign_keys="Project.coordinator_id")
    # saved_filters = relationship("SavedFilter", back_populates="owner")
    # custom_filters = relationship("CustomFilter", back_populates="owner")
    # generated_presentations = relationship("Presentation", back_populates="generated_by_user")
    # audit_logs = relationship("AuditLog", back_populates="actor")
    # permissions = relationship("UserPermission", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', full_name='{self.full_name}', role='{self.role}')>"

    @property
    def custom_permissions(self):
        """Exposição de permissões personalizadas para respostas API."""
        return self.permissions_json

    @property
    def permissions_summary(self):
        """Resumo curto das permissões habilitadas para exibição em listagens."""
        if not self.permissions_json:
            return None

        enabled = [key for key, value in self.permissions_json.items() if value]
        if not enabled:
            return None

        if len(enabled) <= 4:
            return ", ".join(enabled)

        return ", ".join(enabled[:4]) + "..."
