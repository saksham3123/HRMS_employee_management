import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function HomeRedirect() {
  const { user } = useAuth();


  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={user.role === "admin" ? "/admin" : "/user"}
      replace
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Employee routes */}
        <Route element={<ProtectedRoute allowedRole="user" />}>
          <Route path="/user" element={<EmployeeDashboard />} />
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
