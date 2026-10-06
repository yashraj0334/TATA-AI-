import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import UploadDocument from './pages/UploadDocument';
import Processing from './pages/Processing';
import Review from './pages/Review';
import AuditHistory from './pages/AuditHistory';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';
import { useAuth } from './hooks/useAuth';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signin" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<UploadDocument />} />
        <Route path="/processing" element={<Processing />} />
        <Route path="/review" element={<Review />} />
        <Route path="/audit" element={<AuditHistory />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
