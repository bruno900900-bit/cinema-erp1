from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ....core.database import get_db
from ....models.user import User, UserRole
from ....core.auth import get_password_hash
from pydantic import BaseModel

router = APIRouter(prefix="/quick-setup", tags=["quick-setup"])

class QuickUserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "admin"

@router.post("/create-user")
def create_quick_user(user_data: QuickUserCreate, db: Session = Depends(get_db)):
    """Cria um usuário rapidamente para teste"""
    try:
        # Verificar se o email já existe
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email já existe no sistema"
            )

        # Mapear role string para enum
        role_mapping = {
            "admin": UserRole.ADMIN,
            "manager": UserRole.MANAGER,
            "coordinator": UserRole.COORDINATOR,
            "operator": UserRole.OPERATOR,
            "viewer": UserRole.VIEWER,
            "client": UserRole.CLIENT
        }

        user_role = role_mapping.get(user_data.role.lower(), UserRole.OPERATOR)

        # Criar usuário
        new_user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            password_hash=get_password_hash(user_data.password),
            role=user_role,
            is_active=True,
            timezone="America/Sao_Paulo",
            locale="pt-BR"
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": "Usuário criado com sucesso!",
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "full_name": new_user.full_name,
                "role": new_user.role.value,
                "is_active": new_user.is_active
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar usuário: {str(e)}"
        )

@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    """Lista todos os usuários"""
    try:
        users = db.query(User).all()
        return {
            "users": [
                {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role.value,
                    "is_active": user.is_active,
                    "created_at": user.created_at.isoformat() if user.created_at else None
                }
                for user in users
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar usuários: {str(e)}"
        )

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Deleta um usuário"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado"
            )

        db.delete(user)
        db.commit()

        return {"message": "Usuário deletado com sucesso!"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao deletar usuário: {str(e)}"
        )


