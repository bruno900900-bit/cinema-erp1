from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime
from ..models.notification import Notification, NotificationSettings, NotificationType
from ..schemas.notification import (
    NotificationCreate,
    NotificationUpdate,
    NotificationResponse,
    NotificationStats,
    NotificationSettingsResponse,
    NotificationSettingsUpdate
)

class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def get_notifications(
        self,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        is_read: Optional[bool] = None,
        notification_type: Optional[str] = None
    ) -> List[NotificationResponse]:
        """Lista notificações com filtros opcionais"""
        query = self.db.query(Notification)

        if user_id:
            query = query.filter(Notification.user_id == user_id)

        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)

        if notification_type:
            try:
                notif_type = NotificationType(notification_type)
                query = query.filter(Notification.type == notif_type)
            except ValueError:
                # Se o tipo não for válido, retorna lista vazia
                return []

        notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
        return [NotificationResponse.from_orm(notification) for notification in notifications]

    def get_notification_by_id(self, notification_id: int) -> Optional[NotificationResponse]:
        """Obtém uma notificação por ID"""
        notification = self.db.query(Notification).filter(Notification.id == notification_id).first()
        return NotificationResponse.from_orm(notification) if notification else None

    def create_notification(self, notification_data: NotificationCreate) -> NotificationResponse:
        """Cria uma nova notificação"""
        notification = Notification(
            title=notification_data.title,
            message=notification_data.message,
            type=notification_data.type,
            user_id=notification_data.user_id,
            action_url=notification_data.action_url,
            action_text=notification_data.action_text
        )

        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)

        return NotificationResponse.from_orm(notification)

    def update_notification(self, notification_id: int, notification_data: NotificationUpdate) -> Optional[NotificationResponse]:
        """Atualiza uma notificação existente"""
        notification = self.db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            return None

        # Atualizar campos fornecidos
        update_data = notification_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(notification, field, value)

        # Se marcando como lida, definir read_at
        if notification_data.is_read and not notification.is_read:
            notification.read_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(notification)

        return NotificationResponse.from_orm(notification)

    def mark_as_read(self, notification_id: int) -> bool:
        """Marca uma notificação como lida"""
        notification = self.db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            return False

        notification.is_read = True
        notification.read_at = datetime.utcnow()
        self.db.commit()

        return True

    def mark_all_as_read(self, user_id: int) -> int:
        """Marca todas as notificações de um usuário como lidas"""
        notifications = (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .all()
        )

        count = 0
        for notification in notifications:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            count += 1

        self.db.commit()
        return count

    def delete_notification(self, notification_id: int) -> bool:
        """Remove uma notificação"""
        notification = self.db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            return False

        self.db.delete(notification)
        self.db.commit()

        return True

    def get_notification_stats(self, user_id: Optional[int] = None) -> NotificationStats:
        """Obtém estatísticas das notificações"""
        query = self.db.query(Notification)

        if user_id:
            query = query.filter(Notification.user_id == user_id)

        # Total de notificações
        total = query.count()

        # Notificações não lidas
        unread = query.filter(Notification.is_read == False).count()

        # Por tipo
        by_type_query = query.group_by(Notification.type)
        by_type_results = by_type_query.with_entities(
            Notification.type,
            func.count(Notification.id)
        ).all()

        by_type = {notif_type.value: count for notif_type, count in by_type_results}

        # Notificações recentes
        recent_notifications = (
            query.order_by(desc(Notification.created_at))
            .limit(5)
            .all()
        )
        recent_notifications_response = [
            NotificationResponse.from_orm(notification)
            for notification in recent_notifications
        ]

        return NotificationStats(
            total=total,
            unread=unread,
            by_type=by_type,
            recent_notifications=recent_notifications_response
        )

    def get_notification_settings(self, user_id: int) -> NotificationSettingsResponse:
        """Obtém configurações de notificação do usuário"""
        settings = (
            self.db.query(NotificationSettings)
            .filter(NotificationSettings.user_id == user_id)
            .first()
        )

        if not settings:
            # Criar configurações padrão se não existirem
            settings = NotificationSettings(
                user_id=user_id,
                email_notifications=True,
                push_notifications=True,
                sms_notifications=False,
                notification_types="info,success,warning,error"
            )
            self.db.add(settings)
            self.db.commit()
            self.db.refresh(settings)

        # Converter string para lista
        notification_types = settings.notification_types.split(',') if settings.notification_types else []

        return NotificationSettingsResponse(
            user_id=settings.user_id,
            email_notifications=settings.email_notifications,
            push_notifications=settings.push_notifications,
            sms_notifications=settings.sms_notifications,
            notification_types=notification_types,
            created_at=settings.created_at,
            updated_at=settings.updated_at
        )

    def update_notification_settings(self, user_id: int, settings_data: NotificationSettingsUpdate) -> NotificationSettingsResponse:
        """Atualiza configurações de notificação do usuário"""
        settings = (
            self.db.query(NotificationSettings)
            .filter(NotificationSettings.user_id == user_id)
            .first()
        )

        if not settings:
            # Criar configurações se não existirem
            settings = NotificationSettings(user_id=user_id)
            self.db.add(settings)

        # Atualizar campos fornecidos
        update_data = settings_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == 'notification_types' and value is not None:
                # Converter lista para string
                setattr(settings, field, ','.join(value))
            else:
                setattr(settings, field, value)

        self.db.commit()
        self.db.refresh(settings)

        # Converter string para lista
        notification_types = settings.notification_types.split(',') if settings.notification_types else []

        return NotificationSettingsResponse(
            user_id=settings.user_id,
            email_notifications=settings.email_notifications,
            push_notifications=settings.push_notifications,
            sms_notifications=settings.sms_notifications,
            notification_types=notification_types,
            created_at=settings.created_at,
            updated_at=settings.updated_at
        )

    def create_system_notification(
        self,
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.INFO,
        user_id: Optional[int] = None,
        action_url: Optional[str] = None,
        action_text: Optional[str] = None
    ) -> Optional[NotificationResponse]:
        """Cria uma notificação do sistema"""
        if user_id is None:
            # Se não especificado, criar para todos os usuários ativos
            from ..models.user import User
            users = self.db.query(User).filter(User.is_active == True).all()

            notifications = []
            for user in users:
                notification = Notification(
                    title=title,
                    message=message,
                    type=notification_type,
                    user_id=user.id,
                    action_url=action_url,
                    action_text=action_text
                )
                self.db.add(notification)
                notifications.append(notification)

            self.db.commit()
            return None  # Retorna None para notificações múltiplas
        else:
            # Notificação para usuário específico
            notification_data = NotificationCreate(
                title=title,
                message=message,
                type=notification_type,
                user_id=user_id,
                action_url=action_url,
                action_text=action_text
            )
            return self.create_notification(notification_data)

