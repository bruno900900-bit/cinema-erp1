from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class UserPermissionBase(BaseModel):
    module: str = Field(..., min_length=1, max_length=50, description="Módulo do sistema")
    action: str = Field(..., min_length=1, max_length=50, description="Ação específica")
    can_read: bool = Field(True, description="Pode visualizar")
    can_create: bool = Field(False, description="Pode criar")
    can_update: bool = Field(False, description="Pode atualizar")
    can_delete: bool = Field(False, description="Pode excluir")
    can_manage: bool = Field(False, description="Pode gerenciar")
    restrictions_json: Optional[Dict[str, Any]] = Field(None, description="Restrições específicas")

class UserPermissionCreate(UserPermissionBase):
    user_id: int = Field(..., description="ID do usuário")

class UserPermissionUpdate(BaseModel):
    can_read: Optional[bool] = None
    can_create: Optional[bool] = None
    can_update: Optional[bool] = None
    can_delete: Optional[bool] = None
    can_manage: Optional[bool] = None
    restrictions_json: Optional[Dict[str, Any]] = None

class UserPermissionResponse(UserPermissionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserPermissionBulkCreate(BaseModel):
    user_id: int
    permissions: List[UserPermissionBase]

class PermissionTemplate(BaseModel):
    name: str = Field(..., description="Nome do template")
    description: str = Field(..., description="Descrição do template")
    permissions: List[UserPermissionBase] = Field(..., description="Lista de permissões")

# Templates pré-definidos
DEFAULT_PERMISSION_TEMPLATES = {
    "admin": PermissionTemplate(
        name="Administrador",
        description="Acesso total ao sistema",
        permissions=[
            UserPermissionBase(module="users", action="all", can_read=True, can_create=True, can_update=True, can_delete=True, can_manage=True),
            UserPermissionBase(module="projects", action="all", can_read=True, can_create=True, can_update=True, can_delete=True, can_manage=True),
            UserPermissionBase(module="locations", action="all", can_read=True, can_create=True, can_update=True, can_delete=True, can_manage=True),
            UserPermissionBase(module="visits", action="all", can_read=True, can_create=True, can_update=True, can_delete=True, can_manage=True),
            UserPermissionBase(module="reports", action="all", can_read=True, can_create=True, can_update=True, can_delete=True, can_manage=True),
            UserPermissionBase(module="settings", action="all", can_read=True, can_create=True, can_update=True, can_delete=True, can_manage=True),
        ]
    ),
    "manager": PermissionTemplate(
        name="Gerente",
        description="Gerencia projetos e equipes",
        permissions=[
            UserPermissionBase(module="users", action="view", can_read=True, can_create=False, can_update=False, can_delete=False, can_manage=False),
            UserPermissionBase(module="projects", action="all", can_read=True, can_create=True, can_update=True, can_delete=False, can_manage=True),
            UserPermissionBase(module="locations", action="all", can_read=True, can_create=True, can_update=True, can_delete=False, can_manage=True),
            UserPermissionBase(module="visits", action="all", can_read=True, can_create=True, can_update=True, can_delete=False, can_manage=True),
            UserPermissionBase(module="reports", action="view", can_read=True, can_create=False, can_update=False, can_delete=False, can_manage=False),
        ]
    ),
    "coordinator": PermissionTemplate(
        name="Coordenador",
        description="Coordena visitas e locações",
        permissions=[
            UserPermissionBase(module="projects", action="view", can_read=True, can_create=False, can_update=False, can_delete=False, can_manage=False),
            UserPermissionBase(module="locations", action="manage", can_read=True, can_create=True, can_update=True, can_delete=False, can_manage=True),
            UserPermissionBase(module="visits", action="all", can_read=True, can_create=True, can_update=True, can_delete=False, can_manage=True),
        ]
    ),
    "operator": PermissionTemplate(
        name="Operador",
        description="Operador de campo",
        permissions=[
            UserPermissionBase(module="projects", action="view", can_read=True, can_create=False, can_update=False, can_delete=False, can_manage=False),
            UserPermissionBase(module="locations", action="view", can_read=True, can_create=False, can_update=False, can_delete=False, can_manage=False),
            UserPermissionBase(module="visits", action="participate", can_read=True, can_create=False, can_update=True, can_delete=False, can_manage=False),
        ]
    ),
    "viewer": PermissionTemplate(
        name="Visualizador",
        description="Apenas visualização",
        permissions=[
            UserPermissionBase(module="projects", action="view", can_read=True, can_create=False, can_update=False, can_delete=False, can_manage=False),
            UserPermissionBase(module="locations", action="view", can_read=True, can_create=False, can_update=False, can_delete=False, can_manage=False),
            UserPermissionBase(module="visits", action="view", can_read=True, can_create=False, can_update=False, can_delete=False, can_manage=False),
        ]
    ),
    "client": PermissionTemplate(
        name="Cliente",
        description="Cliente externo com acesso limitado",
        permissions=[
            UserPermissionBase(module="projects", action="own", can_read=True, can_create=False, can_update=False, can_delete=False, can_manage=False, restrictions_json={"own_only": True}),
            UserPermissionBase(module="locations", action="view", can_read=True, can_create=False, can_update=False, can_delete=False, can_manage=False),
            UserPermissionBase(module="visits", action="own", can_read=True, can_create=False, can_update=False, can_delete=False, can_manage=False, restrictions_json={"own_only": True}),
        ]
    ),
}
