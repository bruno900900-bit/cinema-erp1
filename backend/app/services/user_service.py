from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from ..models.user import User, UserRole
from ..schemas.user import UserCreate, UserUpdate, UserResponse, UserList, UserListResponse, UserPasswordChange, UserBulkAction
from ..core.auth import get_password_hash, verify_password

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def create_user(self, user_data: UserCreate) -> UserResponse:
        """Cria um novo usuário"""
        # Verificar se email já existe
        existing_user = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise ValueError("Email já está em uso")

        # Hash da senha
        user_dict = user_data.model_dump()
        user_dict['password_hash'] = get_password_hash(user_dict.pop('password'))

        # Garantir que novos usuários começam como Visualizador, a menos que explicitamente definido
        user_dict.setdefault('role', UserRole.VIEWER)

        # Criar usuário
        user = User(**user_dict)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return UserResponse.model_validate(user)

    def get_user(self, user_id: int) -> Optional[UserResponse]:
        """Obtém um usuário por ID"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        return UserResponse.model_validate(user)

    def get_users(self, skip: int = 0, limit: int = 100, search: str = None, role: UserRole = None, is_active: bool = None) -> UserListResponse:
        """Lista usuários com filtros e paginação"""
        query = self.db.query(User)

        if search:
            query = query.filter(
                or_(
                    User.full_name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                    User.phone.ilike(f"%{search}%")
                )
            )

        if role:
            query = query.filter(User.role == role)

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        # Contar total
        total = query.count()

        # Aplicar paginação
        users = query.offset(skip).limit(limit).all()

        # Calcular total de páginas
        total_pages = (total + limit - 1) // limit

        return UserListResponse(
            users=[UserList.model_validate(user) for user in users],
            total=total,
            page=skip // limit + 1,
            size=limit,
            total_pages=total_pages
        )

    def update_user(self, user_id: int, user_data: UserUpdate) -> Optional[UserResponse]:
        """Atualiza um usuário"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        update_data = user_data.model_dump(exclude_unset=True)

        # Verificar se email já existe (se estiver sendo alterado)
        if 'email' in update_data and update_data['email'] != user.email:
            existing_user = self.db.query(User).filter(User.email == update_data['email']).first()
            if existing_user:
                raise ValueError("Email já está em uso")

        # Hash da senha se fornecida
        if 'password' in update_data:
            update_data['password_hash'] = get_password_hash(update_data.pop('password'))

        for field, value in update_data.items():
            setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)

        return UserResponse.model_validate(user)

    def update_user_permissions(self, user_id: int, permissions: Dict[str, Any]) -> Optional[UserResponse]:
        """Atualiza permissões personalizadas do usuário."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        # Sanitizar para apenas valores booleanos (rotas específicas)
        sanitized = {
            key: bool(value) for key, value in (permissions or {}).items()
        }

        user.permissions_json = sanitized
        self.db.commit()
        self.db.refresh(user)

        return UserResponse.model_validate(user)

    def delete_user(self, user_id: int) -> bool:
        """Remove um usuário (soft delete)"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        # Soft delete - marcar como inativo
        user.is_active = False
        self.db.commit()
        return True

    def activate_user(self, user_id: int) -> bool:
        """Ativa um usuário"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        user.is_active = True
        self.db.commit()
        return True

    def change_password(self, user_id: int, password_data: UserPasswordChange) -> bool:
        """Altera senha do usuário"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        # Verificar senha atual
        if not verify_password(password_data.current_password, user.password_hash):
            raise ValueError("Senha atual incorreta")

        # Atualizar senha
        user.password_hash = get_password_hash(password_data.new_password)
        self.db.commit()
        return True

    def bulk_action(self, action_data: UserBulkAction) -> Dict[str, Any]:
        """Executa ação em lote nos usuários"""
        results = {"success": [], "errors": []}

        for user_id in action_data.user_ids:
            try:
                user = self.db.query(User).filter(User.id == user_id).first()
                if not user:
                    results["errors"].append({"id": user_id, "error": "Usuário não encontrado"})
                    continue

                if action_data.action == "activate":
                    user.is_active = True
                elif action_data.action == "deactivate":
                    user.is_active = False
                elif action_data.action == "delete":
                    user.is_active = False  # Soft delete
                elif action_data.action == "change_role" and action_data.role:
                    user.role = action_data.role
                else:
                    results["errors"].append({"id": user_id, "error": "Ação inválida"})
                    continue

                self.db.commit()
                results["success"].append({"id": user_id, "email": user.email})

            except Exception as e:
                results["errors"].append({"id": user_id, "error": str(e)})

        return results

    def get_users_by_role(self, role: UserRole) -> List[UserList]:
        """Obtém usuários por role"""
        users = self.db.query(User).filter(User.role == role, User.is_active == True).all()
        return [UserList.model_validate(user) for user in users]

    def get_user_stats(self) -> Dict[str, Any]:
        """Obtém estatísticas de usuários"""
        total_users = self.db.query(User).count()
        active_users = self.db.query(User).filter(User.is_active == True).count()

        role_stats = {}
        for role in UserRole:
            count = self.db.query(User).filter(User.role == role, User.is_active == True).count()
            role_stats[role.value] = count

        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "role_distribution": role_stats
        }

    def get_users_for_assignment(self) -> List[Dict[str, Any]]:
        """Obtém usuários disponíveis para atribuição"""
        users = self.db.query(User).filter(User.is_active == True).all()
        return [
            {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role.value,
                "phone": user.phone
            }
            for user in users
        ]

    def get_user_activity_summary(self, user_id: int) -> Dict[str, Any]:
        """Obtém resumo de atividades do usuário"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}

        return {
            "user_id": user_id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role.value,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "updated_at": user.updated_at
        }
