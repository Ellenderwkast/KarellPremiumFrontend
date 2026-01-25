import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isAdmin) {
    // If authenticated but not admin, redirect to home (or show access denied)
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
