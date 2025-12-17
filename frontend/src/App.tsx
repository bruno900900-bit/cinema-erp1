import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './hooks/useAuth';
// import { FirebaseAuthProvider } from './hooks/useFirebaseAuth';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import QuickSetupPage from './pages/QuickSetupPage';
import DashboardPage from './pages/DashboardPage';
import LocationsPage from './pages/LocationsPage';
import LocationDetailPage from './pages/LocationDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectWorkflowPage from './pages/ProjectWorkflowPage';
import ProjectReportsPage from './pages/ProjectReportsPage';
import ContractsPage from './pages/ContractsPage';
import AgendaPage from './pages/AgendaPage';
import UsersPage from './pages/UsersPage';
import FilesPage from './pages/FilesPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage';
import TagsPage from './pages/TagsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import LoadingSpinner from './components/Common/LoadingSpinner';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { setupService, SetupStatus } from './services/setupService';

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
