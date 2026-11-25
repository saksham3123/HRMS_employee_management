import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { companyPath } from "../../utils/companyPath";

export default function ProtectedRoute({ allowedRole, deniedRoles = [] }) {
  const { user } = useAuth();
  const { slug } = useParams();
  const { pathname, search } = useLocation();

  if (!user) {
    return <Navigate to={slug ? `/${slug}/login` : "/login"} replace />;
  }

  // Another company's URL (or a typo in the slug): the same page under the
  // user's own company.
  const ownSlug = user.organization.slug;
  if (slug !== ownSlug) {
    return <Navigate to={pathname.replace(/^\/[^/]+/, `/${ownSlug}`) + search} replace />;
  }

  if (
    (allowedRole && user.role !== allowedRole) ||
    deniedRoles.includes(user.role)
  ) {
    return <Navigate to={companyPath(user)} replace />;
  }

  return <Outlet />;
}
