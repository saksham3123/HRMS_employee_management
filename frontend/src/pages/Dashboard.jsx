import { useCallback, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import DashboardOverview from "../components/dashboard/DashboardOverview";
import DashboardModuleContent from "../components/dashboard/DashboardModuleContent";
import {
  canAccessModule,
  findModule,
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
import { companyPath } from "../utils/companyPath";
import "../components/dashboard/Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  // The module lives in the URL (/<slug>/dashboard/leaves), so refresh, Back and
  // shared links all land on the same page.
  const { module: moduleKey = "overview" } = useParams();
  const selectedModule = findModule(moduleKey);
  const canOpen =
    moduleKey !== "profile" && canAccessModule(selectedModule, user, hasPermission);
  const activeModule = canOpen ? moduleKey : null;

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

  // The fetchers only set state after their request resolves; the loading
  // flags for a newly opened module are set below, while rendering.
  const fetchEmployees = useCallback(async () => {
    try {
      const data = await getAllEmployees();
      setEmployees(data.users ?? []);
      setEmployeeError("");
    } catch (error) {
      setEmployeeError(error.message || "Failed to load employees.");
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const data = await getTodayAttendanceForAdmin();
      setTodayAttendance(data.attendance ?? []);
      setAttendanceError("");
    } catch (error) {
      setAttendanceError(error.message || "Failed to load today's attendance.");
    } finally {
      setTodayAttendanceLoading(false);
    }
  }, []);

  const fetchMyAttendance = useCallback(async () => {
    const errors = [];

    try {
      const data = await getTodayAttendance();
      setMyAttendance(data.attendance ?? null);
    } catch (error) {
      errors.push(`Today's attendance: ${error.message || "failed to load."}`);
    }

    try {
      const data = await getAttendanceHistory();
      setAttendanceHistory(data.attendance ?? data.records ?? []);
    } catch (error) {
      errors.push(`Attendance history: ${error.message || "failed to load."}`);
    }

    setMyAttendanceError(errors.join(" "));
    setMyAttendanceLoading(false);
  }, []);

  const needsEmployees =
    activeModule === "employees" ||
    (activeModule === "payroll" && hasPermission("users.view"));

  // Opening a module shows its loading state straight away (adjusting state
  // during render, so there's no flash of the previous module's data).
  const [preparedModule, setPreparedModule] = useState(null);
  if (preparedModule !== activeModule) {
    setPreparedModule(activeModule);
    if (needsEmployees) {
      setEmployeesLoading(true);
      setEmployeeError("");
    } else if (activeModule === "attendance") {
      setTodayAttendanceLoading(true);
      setAttendanceError("");
    } else if (activeModule === "myAttendance") {
      setMyAttendanceLoading(true);
      setMyAttendanceError("");
    }
  }

  // Load whatever the open module needs whenever it changes.
  // The fetchers only set state after their request settles, which this rule
  // can't see through.
  useEffect(() => {
    if (needsEmployees) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchEmployees();
    } else if (activeModule === "attendance") {
      fetchTodayAttendance();
    } else if (activeModule === "myAttendance") {
      fetchMyAttendance();
    }
  }, [activeModule, needsEmployees, fetchEmployees, fetchTodayAttendance, fetchMyAttendance]);

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

  if (moduleKey === "profile") {
    return <Navigate to={companyPath(user, "/profile")} replace />;
  }

  // Unknown module, or one this account can't open: back to the overview.
  if (!activeModule) {
    return <Navigate to={companyPath(user)} replace />;
  }

  return (
    <DashboardLayout activeItem={activeModule}>
      {activeModule === "overview" ? (
        <DashboardOverview user={user} hasPermission={hasPermission} />
      ) : (
        <>
          <div className="dashq-page-heading">
            <div>
              <h1>{selectedModule.title}</h1>
              {selectedModule.description && <p>{selectedModule.description}</p>}
            </div>
          </div>

          <DashboardModuleContent
            activeModule={activeModule}
            user={user}
            hasPermission={hasPermission}
            onCreateEmployee={handleCreateEmployee}
            onEmployeesImported={fetchEmployees}
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
