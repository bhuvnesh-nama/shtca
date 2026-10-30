import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import type { RootState } from "../app/store";
import Loading from "@/components/Loading";

export default function GuestRoute() {
  const { isLoggedIn, isEmailVerified, loading } = useSelector(
    (state: RootState) => state.auth
  );

  if (loading) {
    return (
      <div className="h-[92vh] flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoggedIn && !isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <Outlet />;
}
