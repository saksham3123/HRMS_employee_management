import { Navigate, Outlet } from "react-router-dom";
import { isPlatformAuthenticated } from "../../services/platformService";

// Only lets platform (super admin) sessions through.
// The backend still checks the token on every request.
export default function PlatformProtectedRoute() {
  if (!isPlatformAuthenticated()) {
    return <Navigate to="/platform/login" replace />;
  }

  return <Outlet />;
}
