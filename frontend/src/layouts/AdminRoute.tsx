import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import type { RootState } from "@/app/store";
import Loading from "@/components/Loading";

export default function AdminRoute() {
  const { user, isLoggedIn, loading } = useSelector(
    (state: RootState) => state.auth
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loading />
      </div>
    );
  }

  // Not logged in -> redirect to dedicated admin login
  if (!isLoggedIn || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Regular citizen -> forbidden from accessing department administration console
  const isAdminOrOfficer = user.role === "admin" || user.role === "officer";
  if (!isAdminOrOfficer) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

