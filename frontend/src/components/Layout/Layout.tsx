import React, { useState, useMemo } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  LocationOn,
  Assignment,
  Description,
  Event,
  People,
  Assessment,
  Folder,
  Settings,
  AccountCircle,
  Notifications,
  Search,
} from '@mui/icons-material';
import NotificationCenter from '../Common/NotificationCenter';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import type { Permissions } from '../../hooks/usePermissions';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    permission: 'canViewDashboard',
  },
  {
    text: 'Locações',
    icon: <LocationOn />,
    path: '/locations',
    permission: 'canManageLocations',
  },
  {
    text: 'Projetos',
    icon: <Assignment />,
    path: '/projects',
    permission: 'canManageProjects',
  },
  {
    text: 'Contratos',
    icon: <Description />,
    path: '/contracts',
    permission: 'canManageProjects',
  },
  {
    text: 'Agenda',
    icon: <Event />,
    path: '/agenda',
    permission: 'canViewAgenda',
  },
  {
    text: 'Relatórios',
    icon: <Assessment />,
    path: '/reports',
    permission: 'canViewReports',
  },
  {
    text: 'Usuários',
    icon: <People />,
    path: '/users',
    permission: 'canManageUsers',
  },
  {
    text: 'Arquivos',
    icon: <Folder />,
    path: '/files',
    permission: 'canViewReports',
  },
  {
    text: 'Configurações',
    icon: <Settings />,
    path: '/settings',
    permission: 'canManageSettings',
  },
];

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const permissions = usePermissions();

  const availableMenuItems = useMemo(() => {
    const routePermissions: Record<string, keyof Permissions> = {
      '/dashboard': 'canViewDashboard',
      '/users': 'canManageUsers',
      '/projects': 'canManageProjects',
      '/locations': 'canManageLocations',
      '/agenda': 'canViewAgenda',
      '/reports': 'canViewReports',
      '/settings': 'canManageSettings',
      '/files': 'canViewReports',
      '/contracts': 'canManageProjects',
    };

    return menuItems.filter(item => {
      const requiredPermission = routePermissions[item.path];
      return requiredPermission ? permissions[requiredPermission] : true;
    });
  }, [permissions]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}
        >
          Cinema ERP
        </Typography>
      </Box>

      <List sx={{ pt: 2 }}>
        {availableMenuItems.map(item => (
          <ListItem
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              mx: 1,
              borderRadius: 2,
              mb: 0.5,
              cursor: 'pointer',
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.light,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.primary.main,
                },
              },
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  location.pathname === item.path
                    ? 'inherit'
                    : theme.palette.text.secondary,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'rgba(15, 23, 42, 0.8)', // Matching dark theme with opacity
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                color: 'text.primary',
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              {menuItems.find(item => item.path === location.pathname)?.text ||
                'Cinema ERP'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit" size="large">
              <Search />
            </IconButton>

            <NotificationCenter />

            <IconButton onClick={handleMenuOpen} color="inherit" size="large">
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: theme.palette.primary.main,
                  border: `2px solid ${theme.palette.background.paper}`,
                }}
              >
                {user?.full_name?.charAt(0) || <AccountCircle />}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          animation: 'fadeIn 0.4s ease-in-out',
          '@keyframes fadeIn': {
            '0%': {
              opacity: 0,
              transform: 'translateY(10px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
        key={location.pathname} // Forces re-render and animation on route change
      >
        {children}
      </Box>

      {/* Menu do usuário */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <MenuItem onClick={() => handleNavigation('/profile')}>
          <AccountCircle sx={{ mr: 1 }} />
          Meu Perfil
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          Sair
        </MenuItem>
      </Menu>
    </Box>
  );
}
