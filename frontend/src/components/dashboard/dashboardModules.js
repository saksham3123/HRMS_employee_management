export const dashboardModules = [
  {
    key: "employees",
    title: "Employee Management",
    description: "View employee records and manage employee information.",
    permission: "users.view",
    icon: "bi-people",
    section: "People",
    value: "Manage",
    color: "blue",
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
    permissions: ["leave.apply", "leave.manage"],
    icon: "bi-calendar2-check",
    section: "People",
    value: "Requests",
    color: "green",
  },
];

export const hasModulePermission = (module, permissions) =>
  (module.permissions ?? [module.permission]).some((permission) =>
    permissions.includes(permission)
  );
