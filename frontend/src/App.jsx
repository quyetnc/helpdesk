import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { TicketProvider } from './context/TicketContext';
import { PrivateRoute } from './components/PrivateRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TicketListPage } from './pages/TicketListPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { CreateTicketPage } from './pages/CreateTicketPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <TicketProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes — wrapped in Layout */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/my-tickets"
              element={
                <PrivateRoute requiredRoles={['CUSTOMER']}>
                  <Layout>
                    <TicketListPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/tickets/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <TicketDetailPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/create-ticket"
              element={
                <PrivateRoute requiredRoles={['CUSTOMER']}>
                  <Layout>
                    <CreateTicketPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </TicketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
