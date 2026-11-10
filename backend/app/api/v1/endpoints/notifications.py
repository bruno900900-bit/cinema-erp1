from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ....schemas.notification import NotificationCreate, NotificationUpdate, NotificationResponse, NotificationStats
from ....services.notification_service import NotificationService
from ....core.database import get_db
from ....core.auth import get_current_active_user, get_admin_user
from ....models.user import User
from ....models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/me", response_model=List[NotificationResponse])
def get_my_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_read: Optional[bool] = Query(None, description="Filtrar por status de leitura"),
    notification_type: Optional[str] = Query(None, description="Filtrar por tipo de notificação"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Lista notificações do usuário atual"""
    try:
        notification_service = NotificationService(db)
        return notification_service.get_notifications(
            skip=skip,
            limit=limit,
            user_id=current_user.id,
            is_read=is_read,
            notification_type=notification_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar notificações: {str(e)}")

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[int] = Query(None, description="ID do usuário (apenas admin)"),
    is_read: Optional[bool] = Query(None, description="Filtrar por status de leitura"),
    notification_type: Optional[str] = Query(None, description="Filtrar por tipo de notificação"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Lista notificações com filtros opcionais (apenas admin)"""
    try:
        notification_service = NotificationService(db)
        return notification_service.get_notifications(
            skip=skip,
            limit=limit,
            user_id=user_id,
            is_read=is_read,
            notification_type=notification_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar notificações: {str(e)}")

@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtém uma notificação específica por ID"""
    try:
        notification_service = NotificationService(db)
        notification = notification_service.get_notification_by_id(notification_id)

        if not notification:
            raise HTTPException(status_code=404, detail="Notificação não encontrada")

        # Verificar se o usuário é o dono da notificação ou é admin
        if notification.user_id != current_user.id and current_user.role.value != 'admin':
            raise HTTPException(status_code=403, detail="Você não tem permissão para acessar esta notificação")

        return notification
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar notificação: {str(e)}")

@router.post("/", response_model=NotificationResponse)
def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Cria uma nova notificação (apenas admin)"""
    try:
        notification_service = NotificationService(db)
        return notification_service.create_notification(notification_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar notificação: {str(e)}")

@router.patch("/{notification_id}", response_model=NotificationResponse)
def update_notification(
    notification_id: int,
    notification_data: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualiza uma notificação existente"""
    try:
        # Verificar se a notificação existe e pertence ao usuário
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            raise HTTPException(status_code=404, detail="Notificação não encontrada")

        # Verificar ownership ou admin
        if notification.user_id != current_user.id and current_user.role.value != 'admin':
            raise HTTPException(status_code=403, detail="Você não tem permissão para modificar esta notificação")

        notification_service = NotificationService(db)
        updated_notification = notification_service.update_notification(notification_id, notification_data)

        if not updated_notification:
            raise HTTPException(status_code=404, detail="Notificação não encontrada")

        return updated_notification
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar notificação: {str(e)}")

@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Marca uma notificação como lida"""
    try:
        # Verificar ownership
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            raise HTTPException(status_code=404, detail="Notificação não encontrada")

        if notification.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Você não tem permissão para modificar esta notificação")

        notification_service = NotificationService(db)
        success = notification_service.mark_as_read(notification_id)

        if not success:
            raise HTTPException(status_code=404, detail="Notificação não encontrada")

        return {"message": "Notificação marcada como lida"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao marcar notificação como lida: {str(e)}")

@router.patch("/mark-all-read")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Marca todas as notificações do usuário como lidas"""
    try:
        notification_service = NotificationService(db)
        count = notification_service.mark_all_as_read(current_user.id)
        return {"message": f"{count} notificações marcadas como lidas"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao marcar todas as notificações como lidas: {str(e)}")

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove uma notificação (ownership verificado)"""
    try:
        # Verificar se a notificação existe e pertence ao usuário
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            raise HTTPException(status_code=404, detail="Notificação não encontrada")

        # Verificar ownership ou admin
        if notification.user_id != current_user.id and current_user.role.value != 'admin':
            raise HTTPException(status_code=403, detail="Você não tem permissão para excluir esta notificação")

        notification_service = NotificationService(db)
        success = notification_service.delete_notification(notification_id)

        if not success:
            raise HTTPException(status_code=404, detail="Notificação não encontrada")

        return {"message": "Notificação removida com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao remover notificação: {str(e)}")

@router.get("/stats/summary", response_model=NotificationStats)
def get_notification_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtém estatísticas das notificações do usuário"""
    try:
        notification_service = NotificationService(db)
        return notification_service.get_notification_stats(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter estatísticas: {str(e)}")

@router.get("/user/{user_id}/settings")
def get_notification_settings(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtém configurações de notificação do usuário"""
    # Verificar se é o próprio usuário ou admin
    if user_id != current_user.id and current_user.role.value != 'admin':
        raise HTTPException(status_code=403, detail="Você não tem permissão para acessar estas configurações")

    try:
        notification_service = NotificationService(db)
        return notification_service.get_notification_settings(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter configurações: {str(e)}")

@router.patch("/user/{user_id}/settings")
def update_notification_settings(
    user_id: int,
    settings: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualiza configurações de notificação do usuário"""
    # Verificar se é o próprio usuário ou admin
    if user_id != current_user.id and current_user.role.value != 'admin':
        raise HTTPException(status_code=403, detail="Você não tem permissão para modificar estas configurações")

    try:
        notification_service = NotificationService(db)
        return notification_service.update_notification_settings(user_id, settings)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar configurações: {str(e)}")
