import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function AdminRoute() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (user?.role !== 'admin') {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
