import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import EmployeeProfile from "./pages/EmployeeProfile";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import PlatformLoginPage from "./pages/platform/PlatformLoginPage";
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import PlatformProtectedRoute from "./components/platform/PlatformProtectedRoute";
import LandingPage from "./pages/landing/LandingPage";
import GetStartedPage from "./pages/landing/GetStartedPage";
import { companyPath } from "./utils/companyPath";

// Logged-in company users go straight to their dashboard; everyone else
// sees the public landing page.
function Home() {
  const { user } = useAuth();
  return user ? <Navigate to={companyPath(user)} replace /> : <LandingPage />;
}

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={companyPath(user)} replace />;
}

// Old links without the company (/dashboard/leaves, /user/profile) open the
// same page under the user's company.
function LegacyRedirect() {
  const { user } = useAuth();
  const { pathname, search } = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const path = pathname.startsWith("/user/profile") ? "/profile" : pathname;
  return <Navigate to={companyPath(user, path) + search} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* PeopleDesk platform (super admin) area: separate login and session */}
        <Route path="/platform/login" element={<PlatformLoginPage />} />
        <Route element={<PlatformProtectedRoute />}>
          <Route path="/platform/:section?" element={<PlatformDashboard />} />
        </Route>

        <Route path="/" element={<Home />} />
        <Route path="/get-started/:planCode" element={<GetStartedPage />} />

        <Route path="/dashboard/:module?" element={<LegacyRedirect />} />
        <Route path="/user/profile" element={<LegacyRedirect />} />

        {/* Company pages: /<company slug>/... */}
        <Route path="/:slug/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/:slug/dashboard/:module?" element={<Dashboard />} />
        </Route>

        {/* Self-service pages: everyone except admins (see dashboardModules.js) */}
        <Route element={<ProtectedRoute deniedRoles={["admin"]} />}>
          <Route path="/:slug/profile" element={<EmployeeProfile />} />
        </Route>

        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
