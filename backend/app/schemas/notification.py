from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models.notification import NotificationType

class NotificationBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Título da notificação")
    message: str = Field(..., min_length=1, description="Mensagem da notificação")
    type: NotificationType = Field(..., description="Tipo da notificação")
    user_id: int = Field(..., description="ID do usuário")
    action_url: Optional[str] = Field(None, max_length=500, description="URL de ação")
    action_text: Optional[str] = Field(None, max_length=100, description="Texto do botão de ação")

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    message: Optional[str] = Field(None, min_length=1)
    type: Optional[NotificationType] = None
    is_read: Optional[bool] = None
    action_url: Optional[str] = Field(None, max_length=500)
    action_text: Optional[str] = Field(None, max_length=100)

class NotificationResponse(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime
    updated_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotificationStats(BaseModel):
    total: int
    unread: int
    by_type: Dict[str, int]
    recent_notifications: List[NotificationResponse]

class NotificationSettingsBase(BaseModel):
    email_notifications: bool = True
    push_notifications: bool = True
    sms_notifications: bool = False
    notification_types: List[str] = ["info", "success", "warning", "error"]

class NotificationSettingsResponse(NotificationSettingsBase):
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class NotificationSettingsUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    notification_types: Optional[List[str]] = None

