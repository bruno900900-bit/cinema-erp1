from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from ..models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    bio: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = Field(None, max_length=500)
    # Campos temporariamente removidos para compatibilidade
    # department: Optional[str] = Field(None, max_length=100)
    # position: Optional[str] = Field(None, max_length=100)
    # employee_id: Optional[str] = Field(None, max_length=50)
    # hire_date: Optional[str] = Field(None, max_length=20)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.CONTRIBUTOR
    timezone: str = "America/Sao_Paulo"
    locale: str = "pt-BR"

    # Campos temporariamente removidos para compatibilidade
    # can_create_projects: bool = False
    # can_manage_users: bool = False
    # can_view_financials: bool = False
    # can_export_data: bool = False
    # email_notifications: bool = True
    # sms_notifications: bool = False
    # push_notifications: bool = True

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    bio: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = Field(None, max_length=500)
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    employee_id: Optional[str] = Field(None, max_length=50)
    hire_date: Optional[str] = Field(None, max_length=20)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6)
    timezone: Optional[str] = None
    locale: Optional[str] = None

    # Permissões
    can_create_projects: Optional[bool] = None
    can_manage_users: Optional[bool] = None
    can_view_financials: Optional[bool] = None
    can_export_data: Optional[bool] = None

    # Notificações
    email_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None

    # Preferências
    preferences_json: Optional[Dict[str, Any]] = None
    permissions_json: Optional[Dict[str, Any]] = None

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    timezone: str
    locale: str
    preferences_json: Optional[Dict[str, Any]] = None
    permissions_json: Optional[Dict[str, Any]] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    # Campos calculados
    permissions_summary: Optional[str] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserList(BaseModel):
    id: int
    email: str
    full_name: str
    custom_permissions: Optional[Dict[str, Any]] = None
    role: UserRole
    is_active: bool
    phone: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    users: List[UserList]
    total: int
    page: int
    size: int
    total_pages: int

class UserPasswordChange(BaseModel):
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)

class UserBulkAction(BaseModel):
    user_ids: List[int]
    action: str = Field(..., description="Ação a ser executada: activate, deactivate, delete, change_role")
    role: Optional[UserRole] = None


class UserPermissionsUpdate(BaseModel):
    permissions: Dict[str, Any] = Field(
        ..., description="Mapa de permissões personalizadas (true/false por recurso)"
    )

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
