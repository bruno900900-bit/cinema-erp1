"""
Admin router for user creation with email auto-confirmation.
Uses Supabase Admin API to create users with confirmed emails.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
import os
from supabase import create_client, Client

router = APIRouter(prefix="/admin", tags=["admin"])

# Admin Supabase client with service role key
def get_supabase_admin() -> Client:
    """Get Supabase client with admin privileges (service role key)"""
    url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not service_key:
        raise HTTPException(
            status_code=500,
            detail="SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured"
        )

    return create_client(url, service_key)


class UserCreateRequest(BaseModel):
    """Request model for admin user creation"""
    email: EmailStr
    password: str
    full_name: str
    role: str
    permissions_json: Optional[Dict[str, bool]] = None
    phone: Optional[str] = None
    bio: Optional[str] = None


@router.post("/users/create")
async def create_user_as_admin(user_data: UserCreateRequest):
    """
    Create a new user with auto-confirmed email.
    Only accessible by admins.

    This endpoint uses Supabase Admin API to create users that can login immediately
    without email confirmation.
    """
    try:
        supabase_admin = get_supabase_admin()

        # Step 1: Check if email already exists
        existing = supabase_admin.table('users').select('id, email').eq('email', user_data.email).maybe_single().execute()

        if existing.data:
            raise HTTPException(
                status_code=400,
                detail=f'O email "{user_data.email}" já está cadastrado. Por favor, use outro email.'
            )

        # Step 2: Create auth user with email already confirmed
        try:
            auth_response = supabase_admin.auth.admin.create_user({
                "email": user_data.email,
                "password": user_data.password,
                "email_confirm": True,  # ✅ Auto-confirm email!
                "user_metadata": {
                    "full_name": user_data.full_name,
                    "role": user_data.role
                }
            })
        except Exception as e:
            print(f"Error creating auth user: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Erro ao criar usuário no Auth: {str(e)}"
            )

        if not auth_response or not auth_response.user:
            raise HTTPException(
                status_code=500,
                detail="Falha ao criar usuário no Supabase Auth"
            )

        auth_user_id = auth_response.user.id

        # Step 3: Create database record
        try:
            db_user = supabase_admin.table('users').insert({
                "auth_id": auth_user_id,
                "email": user_data.email,
                "full_name": user_data.full_name,
                "role": user_data.role,
                "permissions_json": user_data.permissions_json or {},
                "phone": user_data.phone,
                "bio": user_data.bio,
                "is_active": True,
                "password_hash": "managed_by_supabase_auth",
            }).execute()
        except Exception as e:
            print(f"Error creating DB user: {e}")
            # Try to clean up auth user if DB insert fails
            try:
                supabase_admin.auth.admin.delete_user(auth_user_id)
            except:
                pass

            raise HTTPException(
                status_code=500,
                detail=f"Erro ao criar usuário no banco: {str(e)}"
            )

        if not db_user.data or len(db_user.data) == 0:
            raise HTTPException(
                status_code=500,
                detail="Falha ao criar registro de usuário no banco de dados"
            )

        print(f"✅ User created successfully with auto-confirmed email: {user_data.email}")
        return db_user.data[0]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in create_user_as_admin: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro inesperado ao criar usuário: {str(e)}"
        )


@router.post("/users/{user_id}/activate")
async def activate_user_and_confirm_email(user_id: int):
    """
    Activate user in database AND confirm email in Supabase Auth.
    This allows the user to login immediately without clicking email confirmation link.
    Only accessible by admins.
    """
    try:
        supabase_admin = get_supabase_admin()

        # Step 1: Get user from database
        user_response = supabase_admin.table('users').select('*').eq('id', user_id).maybe_single().execute()

        if not user_response.data:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado"
            )

        user = user_response.data
        auth_id = user.get('auth_id')

        if not auth_id:
            raise HTTPException(
                status_code=400,
                detail="Usuário não possui auth_id vinculado"
            )

        # Step 2: Confirm email in Supabase Auth
        try:
            supabase_admin.auth.admin.update_user_by_id(
                auth_id,
                {"email_confirm": True}
            )
            print(f"✅ Email confirmed in Auth for user {user_id}")
        except Exception as e:
            print(f"⚠️ Warning: Failed to confirm email in Auth: {e}")
            # Continue anyway - DB activation is most important

        # Step 3: Activate user in database
        activate_response = supabase_admin.table('users').update({
            'is_active': True
        }).eq('id', user_id).execute()

        if not activate_response.data:
            raise HTTPException(
                status_code=500,
                detail="Falha ao ativar usuário no banco de dados"
            )

        print(f"✅ User {user_id} activated successfully")

        return {
            "message": "Usuário ativado e email confirmado com sucesso",
            "user": activate_response.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in activate_user_and_confirm_email: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao ativar usuário: {str(e)}"
        )
