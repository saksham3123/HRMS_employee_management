import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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

// Logged-in company users go straight to their dashboard; everyone else
// sees the public landing page.
function Home() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard/:module?" element={<Dashboard />} />
        </Route>

        {/* Self-service pages: everyone except admins (see dashboardModules.js) */}
        <Route element={<ProtectedRoute deniedRoles={["admin"]} />}>
          <Route path="/user/profile" element={<EmployeeProfile />} />
        </Route>

        {/* PeopleDesk platform (super admin) area: separate login and session */}
        <Route path="/platform/login" element={<PlatformLoginPage />} />
        <Route element={<PlatformProtectedRoute />}>
          <Route path="/platform/:section?" element={<PlatformDashboard />} />
        </Route>

        <Route path="/" element={<Home />} />
        <Route path="/get-started/:planCode" element={<GetStartedPage />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}