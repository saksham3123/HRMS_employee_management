// One place decides who can open each dashboard module. The sidebar, the
// overview and the module content all read from here, so a link is only
// shown when its page will actually work. Each `canAccess` mirrors the
// permission checks the backend routes enforce.
//
// Self-service modules exclude admins: an admin account has every permission
// but no employee record, and the backend refuses admins' leave requests.
const isSelfService = (user) => user?.role !== "admin";

export const dashboardModules = [
  {
    key: "overview",
    title: "Overview",
    icon: "bi-grid-1x2",
    path: "/dashboard",
    canAccess: () => true,
  },
  {
    key: "team",
    title: "My Team",
    description: "Your direct reports, their departments and designations.",
    icon: "bi-people",
    canAccess: (user, has) => user?.role === "manager" && has("employees.view"),
  },
  {
    key: "employees",
    title: "Employee Management",
    description: "Employee records and account access.",
    icon: "bi-people",
    canAccess: (_user, has) => has("users.view"),
  },
  {
    key: "departments",
    title: "Departments",
    description: "Departments and how many people are in each.",
    icon: "bi-diagram-3",
    canAccess: (_user, has) => has("departments.manage"),
  },
  {
    key: "designations",
    title: "Designations",
    description: "Job titles and who holds them.",
    icon: "bi-person-badge",
    canAccess: (_user, has) => has("designations.manage"),
  },
  {
    key: "managers",
    title: "Reporting Managers",
    description: "Who reports to whom.",
    icon: "bi-diagram-2",
    canAccess: (_user, has) => has("users.view") && has("employees.view"),
  },
  {
    key: "leaves",
    title: "Leave",
    description: "Apply for leave, and review the requests you're responsible for.",
    icon: "bi-calendar2-check",
    canAccess: (_user, has) =>
      has("leave.apply") || has("leave.manage") || has("leave.approve.team"),
  },
  {
    key: "attendance",
    title: "Attendance",
    description: "Who has clocked in today, and their hours so far.",
    icon: "bi-clock-history",
    canAccess: (_user, has) => has("attendance.view.all"),
  },
  {
    key: "payroll",
    title: "Payroll",
    description: "Monthly pay summaries and per-employee reports.",
    icon: "bi-wallet2",
    canAccess: (_user, has) => has("payroll.view.all"),
  },
  {
    key: "myAttendance",
    title: "My Attendance",
    description: "Clock in and out, and see your attendance history.",
    icon: "bi-calendar-check",
    canAccess: (user, has) => isSelfService(user) && has("attendance.view.self"),
  },
  {
    key: "profile",
    title: "My Profile",
    icon: "bi-person",
    path: "/user/profile",
    canAccess: (user) => isSelfService(user),
  },
];

export const modulePath = (module) => module.path ?? `/dashboard/${module.key}`;

export const findModule = (key) =>
  dashboardModules.find((module) => module.key === key);

export const canAccessModule = (module, user, hasPermission) =>
  Boolean(module?.canAccess(user, hasPermission));

export const accessibleModules = (user, hasPermission) =>
  dashboardModules.filter((module) =>
    canAccessModule(module, user, hasPermission)
  );
