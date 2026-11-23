import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import EmployeeProfile from "./pages/EmployeeProfile";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import PlatformLoginPage from "./pages/platform/PlatformLoginPage";
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import PlatformProtectedRoute from "./components/platform/PlatformProtectedRoute";

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
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRole="employee" />}>
          <Route path="/user/profile" element={<EmployeeProfile />} />
        </Route>

        {/* PeopleDesk platform (super admin) area: separate login and session */}
        <Route path="/platform/login" element={<PlatformLoginPage />} />
        <Route element={<PlatformProtectedRoute />}>
          <Route path="/platform" element={<PlatformDashboard />} />
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}