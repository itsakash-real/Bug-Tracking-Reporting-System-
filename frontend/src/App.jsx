import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import BugsListPage from './pages/BugsListPage';
import BugDetailPage from './pages/BugDetailPage';
import KanbanPage from './pages/KanbanPage';
import UsersPage from './pages/UsersPage';
import ProjectPage from './pages/ProjectPage';
import AIInsightsPage from './pages/AIInsightsPage';

/**
 * Map routes to page titles for the navbar
 */
const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/bugs': 'All Bugs',
  '/kanban': 'Kanban Board',
  '/ai-insights': 'AI Insights',
  '/users': 'User Management',
  '/project': 'Project',
};

/**
 * ProtectedRoute — redirects unauthenticated users to login.
 * AdminRoute — also restricts access by role.
 * ProjectRoute — ensures user has a project before accessing app features.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'Admin') return <Navigate to="/dashboard" replace />;
  return children;
};

/**
 * ProjectRoute — wraps routes that require a project.
 * If the user has no project, redirect them to /project to create/join one.
 */
const ProjectRoute = ({ children }) => {
  const { isAuthenticated, hasProject } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasProject) return <Navigate to="/project" replace />;
  return children;
};

/**
 * AppLayout — the authenticated shell with sidebar and topbar.
 */
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/bugs/') ? 'Bug Details' : 'BugTracker Pro');

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="with-sidebar main-content">
        <Navbar onMenuToggle={() => setSidebarOpen(true)} pageTitle={pageTitle} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </>
  );
};

/**
 * Root app router — public routes (login, register) and protected app routes.
 */
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />}
      />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Project setup — authenticated but no project required */}
      <Route
        path="/project"
        element={
          <ProtectedRoute>
            <ProjectPage />
          </ProtectedRoute>
        }
      />

      {/* Protected app routes — require project */}
      <Route
        path="/dashboard"
        element={
          <ProjectRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProjectRoute>
        }
      />
      <Route
        path="/bugs"
        element={
          <ProjectRoute>
            <AppLayout>
              <BugsListPage />
            </AppLayout>
          </ProjectRoute>
        }
      />
      <Route
        path="/bugs/:id"
        element={
          <ProjectRoute>
            <AppLayout>
              <BugDetailPage />
            </AppLayout>
          </ProjectRoute>
        }
      />
      <Route
        path="/kanban"
        element={
          <ProjectRoute>
            <AppLayout>
              <KanbanPage />
            </AppLayout>
          </ProjectRoute>
        }
      />
      <Route
        path="/ai-insights"
        element={
          <ProjectRoute>
            <AppLayout>
              <AIInsightsPage />
            </AppLayout>
          </ProjectRoute>
        }
      />

      {/* Admin-only — also requires project */}
      <Route
        path="/users"
        element={
          <ProjectRoute>
            <AdminRoute>
              <AppLayout>
                <UsersPage />
              </AppLayout>
            </AdminRoute>
          </ProjectRoute>
        }
      />

      {/* Project settings (inside app layout, with project) */}
      <Route
        path="/project/settings"
        element={
          <ProjectRoute>
            <AppLayout>
              <ProjectPage />
            </AppLayout>
          </ProjectRoute>
        }
      />

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

/**
 * App — root component wrapping all providers.
 */
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-strong)',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              },
              success: {
                iconTheme: { primary: '#22C55E', secondary: 'white' },
              },
              error: {
                iconTheme: { primary: '#EF4444', secondary: 'white' },
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
