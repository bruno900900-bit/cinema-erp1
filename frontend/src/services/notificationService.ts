import { apiService, normalizeListResponse } from './api';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  user_id: number;
  action_url?: string;
  action_text?: string;
}

export interface NotificationCreate {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  user_id: number;
  action_url?: string;
  action_text?: string;
}

class NotificationService {
  // Obter notificações do usuário
  async getNotifications(userId?: number): Promise<Notification[]> {
    try {
      const endpoint = userId
        ? `/notifications?user_id=${userId}`
        : '/notifications';
      const response = await apiService.get<any>(endpoint);
      return normalizeListResponse<Notification>(response, [
        'notifications',
        'items',
        'results',
      ]);
    } catch (error) {
      console.error('Erro ao obter notificações (sem fallback mock):', error);
      throw error;
    }
  }

  // Marcar notificação como lida
  async markAsRead(notificationId: number): Promise<void> {
    try {
      await apiService.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }

  // Marcar todas as notificações como lidas
  async markAllAsRead(userId: number): Promise<void> {
    try {
      await apiService.patch(`/notifications/mark-all-read`, {
        user_id: userId,
      });
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  }

  // Criar nova notificação
  async createNotification(
    notification: NotificationCreate
  ): Promise<Notification> {
    try {
      const response = await apiService.post<Notification>(
        '/notifications',
        notification
      );
      return response as Notification;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw new Error('Não foi possível criar a notificação');
    }
  }

  // Obter estatísticas de notificações
  async getNotificationStats(userId?: number): Promise<{
    total: number;
    unread: number;
    by_type: { [key: string]: number };
  }> {
    try {
      const endpoint = userId
        ? `/notifications/stats?user_id=${userId}`
        : '/notifications/stats';
      const response = await apiService.get<{
        total: number;
        unread: number;
        by_type: { [key: string]: number };
      }>(endpoint);
      return response;
    } catch (error) {
      console.error(
        'Erro ao obter estatísticas de notificações (sem fallback):',
        error
      );
      throw error;
    }
  }

  // Obter configurações de notificação do usuário
  async getNotificationSettings(userId: number): Promise<{
    email_notifications: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    notification_types: string[];
  }> {
    try {
      const response = await apiService.get<{
        email_notifications: boolean;
        push_notifications: boolean;
        sms_notifications: boolean;
        notification_types: string[];
      }>(`/notifications/settings/${userId}`);
      return response;
    } catch (error) {
      console.error(
        'Erro ao obter configurações de notificação (sem fallback):',
        error
      );
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
