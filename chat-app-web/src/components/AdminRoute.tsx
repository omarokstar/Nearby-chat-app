import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function AdminRoute() {
  const { user, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111]">
        <div className="w-8 h-8 border-4 border-[#131313] dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role =
    typeof user?.role === 'string'
      ? user.role
      : (user?.role as { name?: string } | undefined)?.name;

  if (role !== 'admin') {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
