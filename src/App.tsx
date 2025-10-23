import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout';
import { Home, Vehicles, Parking, Services, Profile, Rewards, Family, Encyclopedia } from './pages';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Onboarding from './pages/Onboarding';
import { Loader } from './components/ui';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<AppLayout><Home /></AppLayout>} />
            <Route path="/vehicles" element={<AppLayout><Vehicles /></AppLayout>} />
            <Route path="/parking" element={<AppLayout><Parking /></AppLayout>} />
            <Route path="/services" element={<AppLayout><Services /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
            <Route path="/rewards" element={<AppLayout><Rewards /></AppLayout>} />
            <Route path="/family" element={<AppLayout><Family /></AppLayout>} />
            <Route path="/encyclopedia/*" element={<AppLayout><Encyclopedia /></AppLayout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/onboarding" element={<Onboarding />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
