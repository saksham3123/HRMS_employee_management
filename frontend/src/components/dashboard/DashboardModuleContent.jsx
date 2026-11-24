import { useState } from "react";
import EmployeeList from "../admin/EmployeeList";
import Modal from "../common/Modal";
import CreateEmployeeForm from "../admin/CreateEmployeeForm";
import AdminAttendanceOverview from "../attendance/AdminAttendanceOverview";
import MonthlyPayrollTable from "../admin/MonthlyPayrollTable";
import MonthlyReport from "../admin/MonthlyReport";
import TodaySummary from "../attendance/TodaySummary";
import AttendanceActions from "../attendance/AttendanceActions";
import AttendanceTable from "../attendance/AttendanceTable";
import LeaveManagement from "../../pages/LeaveManagement";
import Departments from "../admin/departments/Departments";
import Designations from "../admin/designations/Designations";
import ManagerAssignment from "../admin/managers/ManagerAssignment";
import ManagerTeam from "./ManagerTeam";

export default function DashboardModuleContent({
  activeModule,
  user,
  hasPermission,
  onCreateEmployee,
  creatingEmployee,
  employeeError,
  employeeSuccess,
  employees,
  employeesLoading,
  onDeleteEmployee,
  deletingEmployeeId,
  onRoleChange,
  updatingRoleId,
  todayAttendance,
  todayAttendanceLoading,
  attendanceError,
  myAttendanceError,
  myAttendanceLoading,
  myAttendance,
  fetchMyAttendance,
  attendanceHistory,
}) {
  const [showCreateEmployee, setShowCreateEmployee] = useState(false);
  const canCreateEmployee = user?.role === "admin" && hasPermission("users.create");

  // Access to each module is checked once, in pages/Dashboard.jsx, using
  // dashboardModules.js. Checks below only decide what's inside a module.
  if (activeModule === "team") {
    return <ManagerTeam />;
  }

  if (activeModule === "employees") {
    return (
      <div className="space-y-8">
        {canCreateEmployee && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowCreateEmployee(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              + Add employee
            </button>
          </div>
        )}
        {employeeError && !showCreateEmployee && (
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
        <Modal
          open={showCreateEmployee}
          title="Add employee"
          description="Creates their login and employee record. Share the temporary password with them securely."
          onClose={() => setShowCreateEmployee(false)}
          busy={creatingEmployee}
        >
          <CreateEmployeeForm
            onCreate={onCreateEmployee}
            onCreated={() => setShowCreateEmployee(false)}
            onCancel={() => setShowCreateEmployee(false)}
            creating={creatingEmployee}
          />
        </Modal>
        <EmployeeList
          employees={employees}
          loading={employeesLoading}
          onDelete={
            hasPermission("users.deactivate") ? onDeleteEmployee : undefined
          }
          deletingId={deletingEmployeeId}
          onRoleChange={user?.role === "admin" ? onRoleChange : undefined}
          updatingRoleId={updatingRoleId}
        />
      </div>
    );
  }

  if (activeModule === "departments") {
    const canManageDepartments = hasPermission("departments.manage");
    return (
      <Departments
        canView={canManageDepartments}
        canCreate={canManageDepartments}
        canEdit={canManageDepartments}
        canDelete={canManageDepartments}
      />
    );
  }

  if (activeModule === "designations") {
    const canManageDesignations = hasPermission("designations.manage");
    return (
      <Designations
        canView={canManageDesignations}
        canCreate={canManageDesignations}
        canEdit={canManageDesignations}
        canDelete={canManageDesignations}
      />
    );
  }

  if (activeModule === "managers") {
    const canManageManagers = hasPermission("employees.update");
    return (
      <ManagerAssignment
        canView
        canCreate={canManageManagers}
        canEdit={canManageManagers}
        canDelete={canManageManagers}
      />
    );
  }

  if (activeModule === "attendance") {
    return (
      <AdminAttendanceOverview
        records={todayAttendance}
        loading={todayAttendanceLoading}
        error={attendanceError}
      />
    );
  }

  if (activeModule === "leaves") {
    return <LeaveManagement />;
  }

  if (activeModule === "payroll") {
    return (
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
    );
  }

  if (activeModule === "myAttendance") {
    return (
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
    );
  }

  return null;
}
