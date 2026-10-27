import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import EmployeeList from "../components/admin/EmployeeList";
import CreateEmployeeForm from "../components/admin/CreateEmployeeForm";
import AdminAttendanceOverview from "../components/attendance/AdminAttendanceOverview";
import MonthlyPayrollTable from "../components/admin/MonthlyPayrollTable";
import MonthlyReport from "../components/admin/MonthlyReport";
import TodaySummary from "../components/attendance/TodaySummary";
import AttendanceActions from "../components/attendance/AttendanceActions";
import AttendanceTable from "../components/attendance/AttendanceTable";
import {
  getTodayAttendance,
  getAttendanceHistory,
} from "../services/attendanceService";
import {
  createEmployee,
  deleteEmployee,
  getAllEmployees,
  getTodayAttendanceForAdmin,

} from "../services/adminService";
import "../components/dashboard/Dashboard.css";
import LeaveManagement from "./LeaveManagement";

const modules = [
  {
    key: "employees",
    title: "Employee Management",
    description: "View employee records and manage employee information.",
    permission: "users.view",
    icon: "bi-people",
    section: "People",
    value: "Manage",
    color: "purple",
  },
  {
    key: "attendance",
    title: "Attendance",
    description: "Review today's attendance and daily work records.",
    permission: "attendance.view.all",
    icon: "bi-clock-history",
    section: "Operations",
    value: "Overview",
    color: "orange",
  },
  {
    key: "payroll",
    title: "Payroll",
    description: "Review payroll summaries and employee payments.",
    permission: "payroll.view.all",
    icon: "bi-wallet2",
    section: "Finance",
    value: "Reports",
    color: "blue",
  },
  {
    key: "myAttendance",
    title: "My Attendance",
    description: "Clock in or out and review your attendance history.",
    permission: "attendance.view.self",
    role: "employee",
    icon: "bi-calendar-check",
    section: "My workspace",
    value: "Today",
    color: "green",
  },

  {
    key: "leaves",
    title: "Leave Management",
    description: "Apply for leave and track or review requests.",
    permission: "leave.apply",
    icon: "bi-calendar2-check",
    section: "People",
    value: "Requests",
    color: "green",
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { permissions, hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const [activeModule, setActiveModule] = useState(
    modules.some(
      (item) =>
        item.key === location.state?.dashboardModule &&
        permissions.includes(item.permission) &&
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

  const [todayAttendance, setTodayAttendance] = useState([]);
  const [todayAttendanceLoading, setTodayAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");

  const [myAttendance, setMyAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [myAttendanceLoading, setMyAttendanceLoading] = useState(false);
  const [myAttendanceError, setMyAttendanceError] = useState("");

  const visibleModules = useMemo(
    () =>
      modules.filter(
        (item) =>
          permissions.includes(item.permission) &&
          (!item.role || item.role === user?.role) &&
          item.title.toLowerCase().includes(search.toLowerCase())
      ),
    [permissions, search, user?.role]
  );
  const visibleStats = modules.filter(
    (item) =>
      hasPermission(item.permission) &&
      (!item.role || item.role === user?.role)
  );
  const selectedModule = modules.find((item) => item.key === activeModule);

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

    const requestedModule = modules.find((item) => item.key === moduleKey);
    if (
      requestedModule &&
      (!permissions.includes(requestedModule.permission) ||
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

  const openModule = (moduleKey) => {
    setSearch("");
    handleNavigate(moduleKey);
  };

  return (
    <DashboardLayout
      activeItem={activeModule}
      onNavigate={handleNavigate}
    >
      {activeModule === "overview" ? (
        <>
          <div className="dashq-page-heading">
            <div>
              <div className="dashq-eyebrow">WORKSPACE / OVERVIEW</div>
              <h1>Good to see you, {user?.name?.split(" ")[0] || "there"}!</h1>
              <p>Here’s what’s happening across your workspace today.</p>
            </div>
            <div className="dashq-date-pill">
              <i className="bi bi-calendar3" />{" "}
              {new Date().toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>

          <section className="dashq-stat-grid" aria-label="Available HRMS areas">
            {visibleStats.map((item) => (
              <article className="dashq-stat-card" key={item.key}>
                <div className={`dashq-stat-icon ${item.color}`}>
                  <i className={`bi ${item.icon}`} />
                </div>
                <div className="dashq-stat-label">{item.title}</div>
                <div className="dashq-stat-value">{item.value}</div>
                <div className="dashq-stat-foot">
                  <span className="dashq-dot" /> Available with your access
                </div>
              </article>
            ))}
          </section>

          <section className="dashq-content-panel">
            <div className="dashq-panel-heading">
              <div>
                <h2>Your workspace</h2>
                <p>Features shown here are based on your assigned permissions.</p>
              </div>
              <label className="dashq-search">
                <i className="bi bi-search" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Find a feature..."
                  aria-label="Find a feature"
                />
              </label>
            </div>
            {visibleModules.length ? (
              <div className="dashq-module-grid">
                {visibleModules.map((item) => (
                  <article className="dashq-module-card" key={item.key}>
                    <div className="dashq-module-top">
                      <div className="dashq-module-icon">
                        <i className={`bi ${item.icon}`} />
                      </div>
                      <span className="dashq-module-tag">{item.section}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="dashq-module-bottom">
                      <span>
                        <i className="bi bi-shield-check" /> Access granted
                      </span>
                      <button
                        type="button"
                        className="dashq-open-button"
                        onClick={() => openModule(item.key)}
                      >
                        Open <i className="bi bi-arrow-up-right" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashq-empty-state">
                <i className="bi bi-grid-1x2" />
                <h3>No matching features</h3>
                <p>
                  No implemented feature matches your search, or your account
                  has not been assigned access to one yet.
                </p>
              </div>
            )}
          </section>
          <p className="dashq-disclaimer">
            <i className="bi bi-info-circle" /> The backend continues to enforce
            permissions for every data request.
          </p>
        </>
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

          {activeModule === "employees" && (
            <div className="space-y-8">
              {employeeError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
                >
                  {employeeError}
                </p>
              )}
              
              {employeeSuccess && (
                <p
                  role="status"
                  className="rounded-lg bg-green-50 p-4 text-sm text-green-700"
                >
                  {employeeSuccess}
                </p>
              )}
              {user?.role === "admin" && hasPermission("users.create") && (
                <CreateEmployeeForm
                  onCreate={handleCreateEmployee}
                  creating={creatingEmployee}
                />
              )}
              <EmployeeList
                employees={employees}
                loading={employeesLoading}
                onDelete={
                  hasPermission("users.deactivate")
                    ? handleDeleteEmployee
                    : undefined
                }
                deletingId={deletingEmployeeId}
              />
            </div>
          )}

          {activeModule === "attendance" && (
            <AdminAttendanceOverview
              records={todayAttendance}
              loading={todayAttendanceLoading}
              error={attendanceError}
            />
          )}

          {activeModule === "leaves" && (
            <LeaveManagement />
          )}

          {activeModule === "payroll" && (
            <div className="space-y-8">
              <MonthlyPayrollTable />
              {hasPermission("users.view") ? (
                <MonthlyReport employees={employees} />
              ) : (
                <p className="text-sm text-slate-500">
                  Individual reports require employee-list access.
                </p>
              )}
            </div>
          )}

          {activeModule === "myAttendance" && user?.role === "employee" && (
            <div className="space-y-8">
              {myAttendanceError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
                >
                  {myAttendanceError}
                </p>
              )}
              {myAttendanceLoading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
                  Loading today's attendance...
                </div>
              ) : (
                <>
                  <TodaySummary attendance={myAttendance} />
                  {hasPermission("attendance.clock") && (
                    <AttendanceActions
                      attendance={myAttendance}
                      onAttendanceUpdated={fetchMyAttendance}
                    />
                  )}
                </>
              )}
              <AttendanceTable
                records={attendanceHistory}
                loading={myAttendanceLoading}
              />
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
