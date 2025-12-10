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
import LoadingSpinner from './components/Common/LoadingSpinner';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { setupService, SetupStatus } from './services/setupService';

function App() {
  console.log('🚀 App component rendering...');

  const [setupLoading, setSetupLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const status: SetupStatus = await setupService.getSetupStatus();
      setNeedsSetup(!status.is_configured);
    } catch (error) {
      console.error('Erro ao verificar status do setup:', error);
      // Se não conseguir verificar, assume que não precisa de setup (backend offline)
      setNeedsSetup(false);
    } finally {
      setSetupLoading(false);
    }
  };

  try {
    const { user, loading } = useAuth();
    console.log('👤 App - Auth state:', { user, loading });

    if (setupLoading || loading) {
      console.log('⏳ App - Loading state, showing spinner');
      return <LoadingSpinner />;
    }

    // If user is not authenticated, decide between Setup or Login
    if (!user) {
      // Show setup only when unauthenticated and setup is required
      if (needsSetup && location.pathname !== '/login') {
        console.log('🔧 App - Needs setup and no user, showing setup page');
        return <QuickSetupPage />;
      }
      console.log('❌ App - No user, showing login page');
      return <LoginPage />;
    }

    console.log('✅ App - User authenticated, rendering main app');

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
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/locations"
                element={
                  <ProtectedRoute>
                    <LocationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/locations/:locationId"
                element={
                  <ProtectedRoute>
                    <LocationDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <ProtectedRoute>
                    <ProjectDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId/workflow"
                element={
                  <ProtectedRoute>
                    <ProjectWorkflowPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId/reports"
                element={
                  <ProtectedRoute>
                    <ProjectReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contracts"
                element={
                  <ProtectedRoute>
                    <ContractsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agenda"
                element={
                  // Dev: allow Agenda without protection to avoid redirects
                  <AgendaPage />
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/files"
                element={
                  <ProtectedRoute>
                    <FilesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
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
