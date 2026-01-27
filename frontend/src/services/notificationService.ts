import { supabase } from '../config/supabaseClient';

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
  read_at?: string;
}

export interface NotificationCreate {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  user_id: number;
  action_url?: string;
  action_text?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: { [key: string]: number };
}

class NotificationService {
  // Obter notificações do usuário
  async getNotifications(userId?: number): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar notificações:', error);
        throw new Error(error.message);
      }

      return (data as Notification[]) || [];
    } catch (error: any) {
      console.error('Erro ao buscar notificações:', error);
      throw error;
    }
  }

  // Marcar notificação como lida
  async markAsRead(notificationId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  // Marcar todas as notificações como lidas
  async markAllAsRead(userId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Erro ao marcar todas como lidas:', error);
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Erro ao marcar todas como lidas:', error);
      throw error;
    }
  }

  // Criar nova notificação (admin apenas)
  async createNotification(
    notification: NotificationCreate
  ): Promise<Notification> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar notificação:', error);
        throw new Error(error.message);
      }

      return data as Notification;
    } catch (error: any) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  // Excluir notificação
  async deleteNotification(notificationId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Erro ao excluir notificação:', error);
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Erro ao excluir notificação:', error);
      throw error;
    }
  }

  // Obter estatísticas de notificações
  async getNotificationStats(userId?: number): Promise<NotificationStats> {
    try {
      let query = supabase.from('notifications').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao obter estatísticas:', error);
        throw new Error(error.message);
      }

      const notifications = (data as Notification[]) || [];
      const total = notifications.length;
      const unread = notifications.filter(n => !n.is_read).length;

      const by_type: { [key: string]: number } = {
        info: 0,
        success: 0,
        warning: 0,
        error: 0,
      };

      notifications.forEach(n => {
        if (by_type[n.type] !== undefined) {
          by_type[n.type]++;
        }
      });

      return {
        total,
        unread,
        by_type,
      };
    } catch (error: any) {
      console.error('Erro ao obter estatísticas:', error);
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
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Se não existir, retornar configurações padrão
        if (error.code === 'PGRST116') {
          return {
            email_notifications: true,
            push_notifications: true,
            sms_notifications: false,
            notification_types: ['info', 'warning', 'error'],
          };
        }
        console.error('Erro ao obter configurações:', error);
        throw new Error(error.message);
      }

      // Converter notification_types de string para array
      const notification_types = data.notification_types
        ? data.notification_types.split(',')
        : ['info', 'warning', 'error'];

      return {
        email_notifications: data.email_notifications,
        push_notifications: data.push_notifications,
        sms_notifications: data.sms_notifications,
        notification_types,
      };
    } catch (error: any) {
      console.error('Erro ao obter configurações:', error);
      throw error;
    }
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(
    userId: number,
    callback: (notification: Notification) => void
  ) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const notificationService = new NotificationService();
