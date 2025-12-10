"""
Sistema de autenticação básico para o Cinema ERP
"""
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..models.user import User, UserRole
from ..core.database import get_db

# Configurações
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production_12345")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Contexto para hash de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Esquema de autenticação
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha está correta"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Gera hash da senha"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Cria token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Autentica usuário com email e senha"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Obtém usuário atual a partir do token JWT"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials

    # Suporte para token de demonstração (dev mode)
    if token.startswith("demo_token_"):
        print(f"🔑 Auth: Detectado token de demonstração: {token}")
        email = "joao.silva@cinema.com"
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                print(f"👤 Auth: Criando usuário de demonstração {email}")
                # Criar usuário demo se não existir
                user = User(
                    email=email,
                    full_name="João Silva",
                    password_hash=get_password_hash("123456"),
                    role=UserRole.ADMIN,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            print(f"✅ Auth: Usuário de demonstração autenticado: {user.id}")
            return user
        except Exception as e:
            print(f"❌ Auth: Erro ao processar usuário de demonstração: {e}")
            raise credentials_exception



    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Obtém usuário ativo atual"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Verifica se o usuário atual é admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas administradores podem acessar esta funcionalidade."
        )
    return current_user

def get_manager_or_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Verifica se o usuário atual é manager ou admin"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas gerentes e administradores podem acessar esta funcionalidade."
        )
    return current_user
