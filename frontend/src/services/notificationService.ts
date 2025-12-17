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

// Mock inicial para evitar erros de API
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: 'Bem-vindo ao Novo Sistema',
    message:
      'Seja bem-vindo ao Cinema ERP 2.0! O sistema foi migrado com sucesso.',
    type: 'success',
    is_read: false,
    created_at: new Date().toISOString(),
    user_id: 1,
  },
];

class NotificationService {
  // Obter notificações do usuário
  async getNotifications(userId?: number): Promise<Notification[]> {
    return MOCK_NOTIFICATIONS;
  }

  // Marcar notificação como lida
  async markAsRead(notificationId: number): Promise<void> {
    const notif = MOCK_NOTIFICATIONS.find(n => n.id === notificationId);
    if (notif) notif.is_read = true;
  }

  // Marcar todas as notificações como lidas
  async markAllAsRead(userId: number): Promise<void> {
    MOCK_NOTIFICATIONS.forEach(n => (n.is_read = true));
  }

  // Criar nova notificação
  async createNotification(
    notification: NotificationCreate
  ): Promise<Notification> {
    const newNotif = {
      ...notification,
      id: Date.now(),
      created_at: new Date().toISOString(),
      is_read: false,
    };
    MOCK_NOTIFICATIONS.unshift(newNotif);
    return newNotif;
  }

  // Obter estatísticas de notificações
  async getNotificationStats(userId?: number): Promise<{
    total: number;
    unread: number;
    by_type: { [key: string]: number };
  }> {
    const total = MOCK_NOTIFICATIONS.length;
    const unread = MOCK_NOTIFICATIONS.filter(n => !n.is_read).length;
    return {
      total,
      unread,
      by_type: { info: 0, success: total, warning: 0, error: 0 },
    };
  }

  // Obter configurações de notificação do usuário
  async getNotificationSettings(userId: number): Promise<{
    email_notifications: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    notification_types: string[];
  }> {
    return {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      notification_types: ['info', 'warning', 'error'],
    };
  }
}

export const notificationService = new NotificationService();
