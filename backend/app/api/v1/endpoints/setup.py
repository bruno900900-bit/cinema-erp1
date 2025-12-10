from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ....core.database import get_db
from ....schemas.user import UserCreate
from ....services.user_service import UserService
from ....models.user import UserRole

router = APIRouter(prefix="/setup", tags=["setup"])

@router.post("/initial-admin")
def create_admin_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Cria o primeiro usuário administrador do sistema"""
    user_service = UserService(db)

    # Verificar se já existe algum usuário
    existing_users = user_service.get_users(limit=1)
    if existing_users:
        raise HTTPException(
            status_code=400,
            detail="Sistema já foi configurado. Usuários já existem."
        )

    # Forçar role de admin para o primeiro usuário
    user_data.role = UserRole.ADMIN
    # Campos temporariamente removidos para compatibilidade
    # user_data.can_manage_users = True
    # user_data.can_create_projects = True
    # user_data.can_view_financials = True
    # user_data.can_export_data = True

    try:
        admin_user = user_service.create_user(user_data)
        return {
            "message": "Usuário administrador criado com sucesso!",
            "user": {
                "id": admin_user.id,
                "email": admin_user.email,
                "full_name": admin_user.full_name,
                "role": admin_user.role
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar usuário administrador: {str(e)}"
        )

@router.get("/status")
def get_setup_status(db: Session = Depends(get_db)):
    """Verifica se o sistema já foi configurado"""
    user_service = UserService(db)

    try:
        users = user_service.get_users(limit=1)
        is_configured = len(users) > 0

        return {
            "is_configured": is_configured,
            "user_count": len(users) if users else 0,
            "message": "Sistema configurado" if is_configured else "Sistema não configurado"
        }
    except Exception as e:
        return {
            "is_configured": False,
            "user_count": 0,
            "message": f"Erro ao verificar status: {str(e)}"
        }
