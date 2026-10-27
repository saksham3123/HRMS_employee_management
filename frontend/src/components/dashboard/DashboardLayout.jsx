import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";

const navigation = [
  { key: "overview", label: "Overview", icon: "bi-grid-1x2", permission: null },
  { key: "employees", label: "Employee Management", icon: "bi-people", permission: "users.view" },
  { key: "leaves", label: "Leave Management", icon: "bi-calendar2-check", permission: "leave.apply" },
  { key: "attendance", label: "Attendance", icon: "bi-clock-history", permission: "attendance.view.all" },
  { key: "payroll", label: "Payroll", icon: "bi-wallet2", permission: "payroll.view.all" },
  { key: "myAttendance", label: "My Attendance", icon: "bi-calendar-check", permission: "attendance.view.self", role: "employee" },
  { key: "profile", label: "My Profile", icon: "bi-person", role: "employee" },
];

export default function DashboardLayout({
  children,
  activeItem = "overview",
  onNavigate,
}) {
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleNavigation = navigation.filter(
    (item) =>
      (!item.permission || hasPermission(item.permission)) &&
      (!item.role || item.role === user?.role)
  );
  const activeLabel =
    navigation.find((item) => item.key === activeItem)?.label ?? activeItem;

  return (
    <div className="dashq-shell">
      {mobileOpen && <button className="dashq-mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`dashq-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="dashq-brand"><span className="dashq-brand-mark"><i className="bi bi-layers-half" /></span><span>People<span className="dashq-brand-light">Desk</span><small>HR MANAGEMENT</small></span></div>
        <div className="dashq-nav-caption">WORKSPACE</div>
        <nav className="dashq-nav" aria-label="Dashboard navigation">
          {visibleNavigation.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`dashq-nav-item ${activeItem === item.key ? "active" : ""}`}
              onClick={() => {
                setMobileOpen(false);
                onNavigate(item.key);
              }}
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
              {activeItem === item.key && <span className="dashq-active-marker" />}
            </button>
          ))}
        </nav>
        <div className="dashq-sidebar-bottom"><div className="dashq-help-icon"><i className="bi bi-life-preserver" /></div><div><strong>Need a hand?</strong><p>Contact your HRMS administrator.</p></div></div>
        <div className="dashq-sidebar-user"><div className="dashq-avatar">{(user?.name || "U").slice(0, 1).toUpperCase()}</div><div className="dashq-user-copy"><strong>{user?.name || "User"}</strong><span>{user?.role || "Member"}</span></div><button type="button" title="Log out" aria-label="Log out" className="dashq-logout" onClick={logout}><i className="bi bi-box-arrow-right" /></button></div>
      </aside>
      <main className="dashq-main">
        <header className="dashq-topbar"><button className="dashq-menu-toggle" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><i className="bi bi-list" /></button><div className="dashq-breadcrumb">Workspace <i className="bi bi-chevron-right" /> <strong>{activeLabel}</strong></div><div className="dashq-top-actions"><span className="dashq-status"><span /> System operational</span><button type="button" className="dashq-top-icon" aria-label="Notifications"><i className="bi bi-bell" /><b /></button><div className="dashq-top-avatar">{(user?.name || "U").slice(0, 1).toUpperCase()}</div></div></header>
        <div className="dashq-main-content">{children}</div>
      </main>
    </div>
  );
}
