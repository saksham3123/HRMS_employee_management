import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ allowedRole }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    const correctPath =
      user.role === "admin" ? "/admin" : "/user";

    return <Navigate to={correctPath} replace />;
  }

  return <Outlet />;
}
