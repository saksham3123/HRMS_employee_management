import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import EmployeeProfile from "./pages/EmployeeProfile";

import LoginPage from "./pages/LoginPage";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import HRDashboard from "./pages/HRDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";


function HomeRedirect() {
  const { user } = useAuth();


  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const dashboardByRole = {
    admin: "/admin",
    hr: "/hr",
    manager: "/manager",
    employee: "/user",
  };

  return (
    <Navigate
      to={dashboardByRole[user.role] || "/login"}
      replace
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />


        {/* HR routes */}
        <Route element={<ProtectedRoute allowedRole="hr" />}>
          <Route path="/hr/*" element={<HRDashboard />} />
        </Route>

        {/* Manager routes */}
        <Route element={<ProtectedRoute allowedRole="manager" />}>
          <Route path="/manager/*" element={<ManagerDashboard />} />
        </Route>


        {/* Employee routes */}
        <Route element={<ProtectedRoute allowedRole="employee" />}>
          <Route path="/user" element={<EmployeeDashboard />} />
          <Route path="/user/profile" element={<EmployeeProfile />} />
        </Route>

        {/* All admin URLs use the same dashboard */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
