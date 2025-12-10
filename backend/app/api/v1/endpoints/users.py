from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from ....schemas.user import UserCreate, UserUpdate, UserResponse, UserList, UserListResponse, UserPasswordChange, UserBulkAction
from ....schemas.user_project import (
    UserProjectCreate, UserProjectUpdate, UserProjectResponse,
    UserProjectListResponse, BulkProjectAssignment, ProjectAccessLevel
)
from ....services.user_service import UserService
from ....core.database import get_db
from ....core.auth import get_admin_user, get_current_active_user
from ....models.user import User, UserRole
from ....models.user_project import UserProject
from ....models.project import Project

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Cria um novo usuário (apenas admin)"""
    user_service = UserService(db)
    try:
        return user_service.create_user(user_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=UserListResponse)
def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Buscar por nome, email ou telefone"),
    role: Optional[UserRole] = Query(None, description="Filtrar por role"),
    is_active: Optional[bool] = Query(None, description="Filtrar por status ativo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Lista usuários com filtros e paginação (apenas admin)"""
    user_service = UserService(db)
    return user_service.get_users(skip=skip, limit=limit, search=search, role=role, is_active=is_active)

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Obtém detalhes de um usuário específico (apenas admin)"""
    user_service = UserService(db)
    user = user_service.get_user(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Atualiza um usuário existente (apenas admin)"""
    user_service = UserService(db)
    try:
        user = user_service.update_user(user_id, user_data)
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Remove um usuário (soft delete) (apenas admin)"""
    user_service = UserService(db)
    success = user_service.delete_user(user_id)

    if not success:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    return {"message": "Usuário removido com sucesso"}

@router.patch("/{user_id}/activate")
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Ativa um usuário (apenas admin)"""
    user_service = UserService(db)
    success = user_service.activate_user(user_id)

    if not success:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    return {"message": "Usuário ativado com sucesso"}


@router.patch("/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Desativa um usuário (apenas admin)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Não permitir desativar o próprio usuário
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Você não pode desativar sua própria conta")

    user.is_active = False
    db.commit()

    return {"message": "Usuário desativado com sucesso"}


@router.patch("/{user_id}/change-password")
def change_password(
    user_id: int,
    password_data: UserPasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Altera senha do usuário (próprio usuário ou admin)"""
    # Verificar se é o próprio usuário ou admin
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Você só pode alterar sua própria senha"
        )

    user_service = UserService(db)
    try:
        success = user_service.change_password(user_id, password_data)
        if not success:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        return {"message": "Senha alterada com sucesso"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/bulk-action")
def bulk_action(
    action_data: UserBulkAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Executa ação em lote nos usuários (apenas admin)"""
    user_service = UserService(db)
    results = user_service.bulk_action(action_data)
    return results

@router.get("/role/{role}", response_model=List[UserList])
def get_users_by_role(
    role: UserRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Obtém usuários por role (apenas admin)"""
    user_service = UserService(db)
    return user_service.get_users_by_role(role)

@router.get("/stats/summary")
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Obtém estatísticas de usuários (apenas admin)"""
    user_service = UserService(db)
    return user_service.get_user_stats()

@router.get("/assignment/available")
def get_users_for_assignment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Obtém usuários disponíveis para atribuição (apenas admin)"""
    user_service = UserService(db)
    return user_service.get_users_for_assignment()

@router.get("/{user_id}/activity")
def get_user_activity_summary(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Obtém resumo de atividades de um usuário (apenas admin)"""
    user_service = UserService(db)
    activity = user_service.get_user_activity_summary(user_id)

    if not activity:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    return activity

@router.get("/me/profile", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_active_user)):
    """Obtém perfil do usuário atual"""
    return UserResponse.model_validate(current_user)

@router.put("/me/profile", response_model=UserResponse)
def update_my_profile(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualiza perfil do usuário atual"""
    # Remover campos que não podem ser alterados pelo próprio usuário
    update_data = user_data.model_dump(exclude_unset=True)
    restricted_fields = ['role', 'is_active', 'password']
    for field in restricted_fields:
        update_data.pop(field, None)

    user_service = UserService(db)
    try:
        user = user_service.update_user(current_user.id, UserUpdate(**update_data))
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== USER PROJECT ACCESS ENDPOINTS ====================

@router.get("/{user_id}/projects", response_model=UserProjectListResponse)
def get_user_projects(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Lista projetos aos quais um usuário tem acesso (apenas admin)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    user_projects = db.query(UserProject).filter(UserProject.user_id == user_id).all()

    projects_response = []
    for up in user_projects:
        project = db.query(Project).filter(Project.id == up.project_id).first()
        projects_response.append({
            "id": up.id,
            "user_id": up.user_id,
            "project_id": up.project_id,
            "access_level": up.access_level,
            "created_at": up.created_at,
            "updated_at": up.updated_at,
            "project_name": project.name if project else None,
            "project_status": project.status.value if project else None
        })

    return {"projects": projects_response, "total": len(projects_response)}


@router.post("/{user_id}/projects", response_model=UserProjectResponse)
def assign_project_to_user(
    user_id: int,
    project_data: UserProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Atribui acesso a um projeto para um usuário (apenas admin)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    project = db.query(Project).filter(Project.id == project_data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    # Verificar se já existe
    existing = db.query(UserProject).filter(
        UserProject.user_id == user_id,
        UserProject.project_id == project_data.project_id
    ).first()

    if existing:
        # Atualizar access_level
        existing.access_level = project_data.access_level
        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "user_id": existing.user_id,
            "project_id": existing.project_id,
            "access_level": existing.access_level,
            "created_at": existing.created_at,
            "updated_at": existing.updated_at,
            "project_name": project.name,
            "project_status": project.status.value
        }

    # Criar novo
    user_project = UserProject(
        user_id=user_id,
        project_id=project_data.project_id,
        access_level=project_data.access_level
    )
    db.add(user_project)
    db.commit()
    db.refresh(user_project)

    return {
        "id": user_project.id,
        "user_id": user_project.user_id,
        "project_id": user_project.project_id,
        "access_level": user_project.access_level,
        "created_at": user_project.created_at,
        "updated_at": user_project.updated_at,
        "project_name": project.name,
        "project_status": project.status.value
    }


@router.post("/{user_id}/projects/bulk", response_model=dict)
def bulk_assign_projects(
    user_id: int,
    assignment: BulkProjectAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Atribui múltiplos projetos a um usuário (apenas admin)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    assigned = 0
    for project_id in assignment.project_ids:
        existing = db.query(UserProject).filter(
            UserProject.user_id == user_id,
            UserProject.project_id == project_id
        ).first()

        if existing:
            existing.access_level = assignment.access_level
        else:
            user_project = UserProject(
                user_id=user_id,
                project_id=project_id,
                access_level=assignment.access_level
            )
            db.add(user_project)
        assigned += 1

    db.commit()
    return {"message": f"{assigned} projetos atribuídos com sucesso", "count": assigned}


@router.delete("/{user_id}/projects/{project_id}")
def remove_project_access(
    user_id: int,
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Remove acesso de um usuário a um projeto (apenas admin)"""
    user_project = db.query(UserProject).filter(
        UserProject.user_id == user_id,
        UserProject.project_id == project_id
    ).first()

    if not user_project:
        raise HTTPException(status_code=404, detail="Acesso não encontrado")

    db.delete(user_project)
    db.commit()

    return {"message": "Acesso removido com sucesso"}
