"""
Endpoints de autenticação
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ....core.database import get_db
from ....core.auth import authenticate_user, create_access_token, get_current_active_user
from ....schemas.user import UserLogin, Token, UserResponse
from ....models.user import User

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Endpoint de login com email e senha"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login-json", response_model=Token)
async def login_with_json(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Endpoint de login usando JSON (para frontend)"""
    user = authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Obtém informações do usuário atual"""
    return current_user

@router.get("/test")
async def test_auth(current_user: User = Depends(get_current_active_user)):
    """Endpoint de teste para verificar autenticação"""
    return {
        "message": "Autenticação funcionando!",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role
        }
    }


# --- Registration Endpoints ---

from ....schemas.user import UserCreate
from ....services.user_service import UserService
from ....models.user import UserRole
from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    """Schema para registro público de usuário"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str | None = None


@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """
    Registra um novo usuário no sistema.
    O usuário é criado com role CONTRIBUTOR e ativo.
    """
    user_service = UserService(db)

    # Verificar se email já existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já está em uso"
        )

    try:
        # Criar usuário
        new_user = UserCreate(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            phone=user_data.phone,
            role=UserRole.CONTRIBUTOR,
        )
        user = user_service.create_user(new_user)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/forgot-password")
async def forgot_password(
    email: EmailStr,
    db: Session = Depends(get_db)
):
    """
    Solicita redefinição de senha.
    Por segurança, sempre retorna sucesso mesmo se email não existir.
    """
    # TODO: Implementar envio de email de recuperação
    return {"message": "Se o email existir no sistema, você receberá instruções para redefinir sua senha."}
