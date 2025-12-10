import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Button,
  Divider,
  Chip,
  Avatar,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  CheckCircle,
  Info,
  Warning,
  Error,
  Delete,
  MoreVert,
  Settings,
  MarkEmailRead,
} from '@mui/icons-material';
import {
  notificationService,
  Notification,
} from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';

interface NotificationCenterProps {
  onNotificationClick?: (notification: Notification) => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle color="success" />;
    case 'warning':
      return <Warning color="warning" />;
    case 'error':
      return <Error color="error" />;
    default:
      return <Info color="info" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'info';
  }
};

export default function NotificationCenter({
  onNotificationClick,
}: NotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);

  const open = Boolean(anchorEl);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getNotifications(user?.id);
      setNotifications(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    if (notifications.length === 0) {
      loadNotifications();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
      }
    }

    onNotificationClick?.(notification);
    handleClose();
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  return (
    <>
      <Tooltip title="Notificações">
        <IconButton
          onClick={handleClick}
          color="inherit"
          sx={{ position: 'relative' }}
        >
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? <NotificationsActive /> : <Notifications />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            mt: 1,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Notificações</Typography>
            <Box>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  startIcon={<MarkEmailRead />}
                  onClick={handleMarkAllAsRead}
                  sx={{ mr: 1 }}
                >
                  Marcar todas como lidas
                </Button>
              )}
              <IconButton size="small">
                <Settings />
              </IconButton>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Notifications
                sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Nenhuma notificação
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.is_read
                        ? 'transparent'
                        : 'action.hover',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: notification.is_read
                                ? 'normal'
                                : 'bold',
                            }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.is_read && (
                            <Chip
                              label="Nova"
                              size="small"
                              color="primary"
                              sx={{ height: 16, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeAgo(notification.created_at)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {notifications.length > 0 && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  // TODO: Navegar para página de notificações
                  console.log('Ver todas as notificações');
                }}
              >
                Ver todas as notificações
              </Button>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
}













































