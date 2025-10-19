import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout';
import { Home, Vehicles, Parking, Services, Profile, Rewards, Family } from './pages';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Onboarding from './pages/Onboarding';
import { Loader } from './components/ui';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { clerkUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-surface dark:bg-dark-base">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  if (!clerkUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { clerkUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-surface dark:bg-dark-base">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  if (clerkUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, clerkUser } = useAuth();

  const getUserName = () => {
    if (clerkUser?.firstName) {
      return clerkUser.firstName;
    }
    if (user?.full_name) {
      return user.full_name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <AuthRoute>
            <SignUp />
          </AuthRoute>
        }
      />
      <Route
        path="/signup/*"
        element={
          <AuthRoute>
            <SignUp />
          </AuthRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout userName={getUserName()}>
              <Home />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <AppLayout userName={getUserName()}>
              <Vehicles />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parking"
        element={
          <ProtectedRoute>
            <AppLayout userName={getUserName()}>
              <Parking />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <AppLayout userName={getUserName()}>
              <Services />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout userName={getUserName()}>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rewards"
        element={
          <ProtectedRoute>
            <AppLayout userName={getUserName()}>
              <Rewards />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/family"
        element={
          <ProtectedRoute>
            <AppLayout userName={getUserName()}>
              <Family />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
