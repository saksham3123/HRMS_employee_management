import EmployeeList from "../admin/EmployeeList";
import CreateEmployeeForm from "../admin/CreateEmployeeForm";
import AdminAttendanceOverview from "../attendance/AdminAttendanceOverview";
import MonthlyPayrollTable from "../admin/MonthlyPayrollTable";
import MonthlyReport from "../admin/MonthlyReport";
import TodaySummary from "../attendance/TodaySummary";
import AttendanceActions from "../attendance/AttendanceActions";
import AttendanceTable from "../attendance/AttendanceTable";
import LeaveManagement from "../../pages/LeaveManagement";

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
  todayAttendance,
  todayAttendanceLoading,
  attendanceError,
  myAttendanceError,
  myAttendanceLoading,
  myAttendance,
  fetchMyAttendance,
  attendanceHistory,
}) {
  if (activeModule === "employees") {
    return (
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
            onCreate={onCreateEmployee}
            creating={creatingEmployee}
          />
        )}
        <EmployeeList
          employees={employees}
          loading={employeesLoading}
          onDelete={
            hasPermission("users.deactivate") ? onDeleteEmployee : undefined
          }
          deletingId={deletingEmployeeId}
        />
      </div>
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

  if (activeModule === "myAttendance" && user?.role === "employee") {
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
