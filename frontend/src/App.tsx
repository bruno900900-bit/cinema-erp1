import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './hooks/useAuth';
// import { FirebaseAuthProvider } from './hooks/useFirebaseAuth';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import QuickSetupPage from './pages/QuickSetupPage';
import LoadingSpinner from './components/Common/LoadingSpinner';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { setupService, SetupStatus } from './services/setupService';

// Páginas carregadas sob demanda (code-splitting por rota) para reduzir o
// tamanho do bundle inicial.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LocationsPage = lazy(() => import('./pages/LocationsPage'));
const LocationDetailPage = lazy(() => import('./pages/LocationDetailPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const ProjectWorkflowPage = lazy(() => import('./pages/ProjectWorkflowPage'));
const ProjectReportsPage = lazy(() => import('./pages/ProjectReportsPage'));
const ContractsPage = lazy(() => import('./pages/ContractsPage'));
const AgendaPage = lazy(() => import('./pages/AgendaPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const FilesPage = lazy(() => import('./pages/FilesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const TagsPage = lazy(() => import('./pages/TagsPage'));
const MyDemandsPage = lazy(() => import('./pages/MyDemandsPage'));
const AdminRolesPage = lazy(() => import('./pages/AdminRolesPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));

function App() {
  console.log('🚀 App component rendering...');

  const [setupLoading, setSetupLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Supabase migration: assume setup is done, skip backend check to avoid CORS errors
    setNeedsSetup(false);
    setSetupLoading(false);
  }, []);

  try {
    const { user, loading } = useAuth();
    console.log('👤 [APP] Auth state:', {
      user: user?.email || null,
      loading,
      timestamp: new Date().toLocaleTimeString(),
    });

    if (setupLoading || loading) {
      console.log('⏳ [APP] Loading state, showing spinner');
      return <LoadingSpinner />;
    }

    // If user is not authenticated, decide between Setup or Login
    if (!user) {
      console.log('❌ [APP] No user found, redirecting to login');
      console.log('📊 [APP] Current location:', location.pathname);

      // Show setup only when unauthenticated and setup is required
      if (needsSetup && location.pathname !== '/login') {
        console.log('🔧 [APP] Needs setup, showing setup page');
        return <QuickSetupPage />;
      }
      console.log('🔑 [APP] Showing login page');
      return <LoginPage />;
    }

    console.log('✅ [APP] User authenticated, rendering main app');

    return (
      <>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Layout>
            <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredPermission="canViewDashboard">
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/locations"
                element={
                  <ProtectedRoute requiredPermission="canManageLocations">
                    <LocationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/locations/:locationId"
                element={
                  <ProtectedRoute requiredPermission="canManageLocations">
                    <LocationDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute requiredPermission="canManageProjects">
                    <ProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <ProtectedRoute requiredPermission="canManageProjects">
                    <ProjectDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId/workflow"
                element={
                  <ProtectedRoute requiredPermission="canManageProjects">
                    <ProjectWorkflowPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId/reports"
                element={
                  <ProtectedRoute requiredPermission="canViewReports">
                    <ProjectReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contracts"
                element={
                  <ProtectedRoute requiredPermission="canManageProjects">
                    <ContractsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agenda"
                element={
                  <ProtectedRoute requiredPermission="canViewAgenda">
                    <AgendaPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute requiredPermission="canViewReports">
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tags"
                element={
                  <ProtectedRoute requiredPermission="canManageLocations">
                    <TagsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredPermission="canManageUsers">
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/files"
                element={
                  <ProtectedRoute requiredPermission="canViewDashboard">
                    <FilesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requiredPermission="canManageSettings">
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/roles"
                element={
                  <ProtectedRoute requiredPermission="canManageUserRoles">
                    <AdminRolesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-demands"
                element={
                  <ProtectedRoute>
                    <MyDemandsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/quick-setup" element={<QuickSetupPage />} />
              <Route
                path="/login"
                element={<Navigate to="/dashboard" replace />}
              />
            </Routes>
            </Suspense>
          </Layout>
        </Box>
      </>
    );
  } catch (error) {
    console.error('❌ App - Error in App component:', error);
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Erro no App</Typography>
          <Typography variant="body2">
            {error instanceof Error ? error.message : 'Erro desconhecido'}
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Verifique o console do navegador para mais detalhes.
        </Typography>
      </Box>
    );
  }
}

export default App;
