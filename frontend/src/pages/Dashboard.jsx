import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import DashboardOverview from "../components/dashboard/DashboardOverview";
import DashboardModuleContent from "../components/dashboard/DashboardModuleContent";
import {
  dashboardModules,
  hasModulePermission,
} from "../components/dashboard/dashboardModules";
import {
  getTodayAttendance,
  getAttendanceHistory,
} from "../services/attendanceService";
import {
  createEmployee,
  deleteEmployee,
  getAllEmployees,
  getTodayAttendanceForAdmin,
  updateEmployee,
} from "../services/adminService";
import "../components/dashboard/Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { permissions, hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const [activeModule, setActiveModule] = useState(
    dashboardModules.some(
      (item) =>
        item.key === location.state?.dashboardModule &&
        hasModulePermission(item, permissions) &&
        (!item.role || item.role === user?.role)
    )
      ? location.state.dashboardModule
      : "overview"
  );

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState("");
  const [employeeSuccess, setEmployeeSuccess] = useState("");
  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState(null);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  const [todayAttendance, setTodayAttendance] = useState([]);
  const [todayAttendanceLoading, setTodayAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");

  const [myAttendance, setMyAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [myAttendanceLoading, setMyAttendanceLoading] = useState(false);
  const [myAttendanceError, setMyAttendanceError] = useState("");

  const visibleModules = useMemo(
    () =>
      dashboardModules.filter(
        (item) =>
          hasModulePermission(item, permissions) &&
          (!item.role || item.role === user?.role) &&
          item.title.toLowerCase().includes(search.toLowerCase())
      ),
    [permissions, search, user?.role]
  );
  const visibleStats = dashboardModules.filter(
    (item) =>
      hasModulePermission(item, permissions) &&
      (!item.role || item.role === user?.role)
  );
  const selectedModule = dashboardModules.find(
    (item) => item.key === activeModule
  );

  const fetchEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    setEmployeeError("");

    try {
      const data = await getAllEmployees();
      setEmployees(data.users ?? []);
    } catch (error) {
      setEmployeeError(error.message || "Failed to load employees.");
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  const fetchTodayAttendance = useCallback(async () => {
    setTodayAttendanceLoading(true);
    setAttendanceError("");

    try {
      const data = await getTodayAttendanceForAdmin();
      setTodayAttendance(data.attendance ?? []);
    } catch (error) {
      setAttendanceError(error.message || "Failed to load today's attendance.");
    } finally {
      setTodayAttendanceLoading(false);
    }
  }, []);

  const fetchMyAttendance = useCallback(async () => {
    setMyAttendanceLoading(true);
    setMyAttendanceError("");
    const errors = [];

    try {
      const data = await getTodayAttendance();
      setMyAttendance(data.attendance ?? null);
    } catch (error) {
      errors.push(error.message || "Failed to load today's attendance.");
    }

    try {
      const data = await getAttendanceHistory();
      setAttendanceHistory(data.attendance ?? data.records ?? []);
    } catch (error) {
      errors.push(error.message || "Failed to load attendance history.");
    }

    setMyAttendanceError(errors.join(" "));
    setMyAttendanceLoading(false);
  }, []);

  const handleNavigate = (moduleKey) => {
    if (moduleKey === "profile") {
      navigate("/user/profile");
      return;
    }

    const requestedModule = dashboardModules.find(
      (item) => item.key === moduleKey
    );
    if (
      requestedModule &&
      (!hasModulePermission(requestedModule, permissions) ||
        (requestedModule.role && requestedModule.role !== user?.role))
    ) {
      setActiveModule("overview");
      return;
    }

    setActiveModule(moduleKey);

    if (
      moduleKey === "employees" ||
      (moduleKey === "payroll" && hasPermission("users.view"))
    ) {
      fetchEmployees();
    } else if (moduleKey === "attendance") {
      fetchTodayAttendance();
    } else if (moduleKey === "myAttendance") {
      fetchMyAttendance();
    }
  };

  const handleCreateEmployee = async (employeeData) => {
    setCreatingEmployee(true);
    setEmployeeError("");
    setEmployeeSuccess("");

    try {
      await createEmployee(employeeData);
      setEmployeeSuccess("Employee created successfully.");
      await fetchEmployees();
    } catch (error) {
      setEmployeeError(error.message || "Failed to create employee.");
      throw error;
    } finally {
      setCreatingEmployee(false);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    setDeletingEmployeeId(employeeId);
    setEmployeeError("");
    setEmployeeSuccess("");

    try {
      await deleteEmployee(employeeId);
      setEmployeeSuccess("Employee deactivated successfully.");
      await fetchEmployees();
    } catch (error) {
      setEmployeeError(error.message || "Failed to deactivate employee.");
    } finally {
      setDeletingEmployeeId(null);
    }
  };

  const handleChangeEmployeeRole = async (
    employeeId,
    role,
    userId
  ) => {
    setUpdatingRoleId(userId);
    setEmployeeError("");
    setEmployeeSuccess("");

    try {
      await updateEmployee(employeeId, { role });
      setEmployeeSuccess("User role updated successfully.");
      await fetchEmployees();
    } catch (error) {
      setEmployeeError(error.message || "Failed to update user role.");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const openModule = (moduleKey) => {
    setSearch("");
    handleNavigate(moduleKey);
  };

  return (
    <DashboardLayout activeItem={activeModule} onNavigate={handleNavigate}>
      {activeModule === "overview" ? (
        <DashboardOverview
          user={user}
          visibleStats={visibleStats}
          visibleModules={visibleModules}
          search={search}
          onSearchChange={setSearch}
          onOpenModule={openModule}
        />
      ) : (
        <>
          <div className="dashq-page-heading">
            <div>
              <div className="dashq-eyebrow">
                WORKSPACE / {selectedModule?.title.toUpperCase()}
              </div>
              <h1>{selectedModule?.title}</h1>
              <p>{selectedModule?.description}</p>
            </div>
            <button
              type="button"
              className="dashq-open-button"
              onClick={() => handleNavigate("overview")}
            >
              <i className="bi bi-arrow-left" /> Back to overview
            </button>
          </div>

          <DashboardModuleContent
            activeModule={activeModule}
            user={user}
            hasPermission={hasPermission}
            onCreateEmployee={handleCreateEmployee}
            creatingEmployee={creatingEmployee}
            employeeError={employeeError}
            employeeSuccess={employeeSuccess}
            employees={employees}
            employeesLoading={employeesLoading}
            onDeleteEmployee={handleDeleteEmployee}
            deletingEmployeeId={deletingEmployeeId}
            onRoleChange={handleChangeEmployeeRole}
            updatingRoleId={updatingRoleId}
            todayAttendance={todayAttendance}
            todayAttendanceLoading={todayAttendanceLoading}
            attendanceError={attendanceError}
            myAttendanceError={myAttendanceError}
            myAttendanceLoading={myAttendanceLoading}
            myAttendance={myAttendance}
            fetchMyAttendance={fetchMyAttendance}
            attendanceHistory={attendanceHistory}
          />
        </>
      )}
    </DashboardLayout>
  );
}
