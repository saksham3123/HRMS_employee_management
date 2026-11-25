import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";
import { accessibleModules, findModule, modulePath } from "./dashboardModules";
import ThemeToggle from "../common/ThemeToggle";
import { companyPath } from "../../utils/companyPath";

const ROLE_LABELS = { admin: "Admin", hr: "HR", manager: "Manager", employee: "Employee" };

export default function DashboardLayout({ children, activeItem = "overview" }) {
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const visibleNavigation = accessibleModules(user, hasPermission);
  const activeModule = findModule(activeItem);
  // Sessions from before the organization was added to the login response
  // have no name to show; they pick it up on the next login.
  const organizationName = user?.organization?.name;
  const initial = (user?.name || "U").slice(0, 1).toUpperCase();
  const roleLabel = ROLE_LABELS[user?.role] ?? user?.role ?? "Member";

  useEffect(() => {
    if (!accountDialogOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setAccountDialogOpen(false);
    };
    const handlePointerDown = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountDialogOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [accountDialogOpen]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <div className="dashq-shell">
      {mobileOpen && <button className="dashq-mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`dashq-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="dashq-brand"><span className="dashq-brand-mark"><i className="bi bi-layers-half" /></span><span>People<span className="dashq-brand-light">Desk</span>{organizationName && <small className="dashq-brand-org" title={organizationName}>{organizationName}</small>}</span></div>
        <nav className="dashq-nav" aria-label="Dashboard navigation">
          {visibleNavigation.map((item) => (
            <Link
              key={item.key}
              to={modulePath(item, user)}
              aria-current={activeItem === item.key ? "page" : undefined}
              className={`dashq-nav-item ${activeItem === item.key ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              <span>{item.title}</span>
              {activeItem === item.key && <span className="dashq-active-marker" />}
            </Link>
          ))}
        </nav>
        {user?.role !== "admin" && (
          <div className="dashq-sidebar-bottom"><div className="dashq-help-icon"><i className="bi bi-life-preserver" aria-hidden="true" /></div><div><strong>Something wrong with your record?</strong><p>Ask your HR team or your company's PeopleDesk admin.</p></div></div>
        )}
        <div className="dashq-sidebar-user"><div className="dashq-avatar">{initial}</div><div className="dashq-user-copy"><strong>{user?.name || "User"}</strong><span>{roleLabel}</span></div><button type="button" title="Log out" aria-label="Log out" className="dashq-logout" onClick={logout}><i className="bi bi-box-arrow-right" /></button></div>
      </aside>
      <main className="dashq-main">
        <header className="dashq-topbar">
          <button
            className="dashq-menu-toggle"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <i className="bi bi-list" />
          </button>
          <nav className="dashq-breadcrumb" aria-label="Breadcrumb">
            {activeItem === "overview" ? (
              <strong>{organizationName ?? "Overview"}</strong>
            ) : (
              <>
                <Link to={companyPath(user)} className="dashq-breadcrumb-root">
                  {organizationName ?? "Overview"}
                </Link>
                <i className="bi bi-chevron-right" aria-hidden="true" />
                <strong aria-current="page">{activeModule?.title ?? activeItem}</strong>
              </>
            )}
          </nav>
          <div className="dashq-top-actions">
            <ThemeToggle />
            <div className="dashq-account-menu" ref={accountMenuRef}>
              <button
                type="button"
                className="dashq-top-avatar-button"
                aria-label="Account details"
                aria-haspopup="true"
                aria-expanded={accountDialogOpen}
                aria-controls="dashq-account-menu"
                onClick={() => setAccountDialogOpen((open) => !open)}
              >
                <span className="dashq-top-avatar">{initial}</span>
              </button>
              {accountDialogOpen && (
                <section
                  className="dashq-account-dropdown"
                  id="dashq-account-menu"
                  aria-label="Account details"
                >
                  <div className="dashq-account-avatar">{initial}</div>
                  <h2>{user?.name || "User"}</h2>
                  {user?.email && (
                    <p className="dashq-account-email">{user.email}</p>
                  )}
                  <span className="dashq-account-role">
                    {roleLabel}
                  </span>
                  {organizationName && (
                    <p className="dashq-account-org">{organizationName}</p>
                  )}
                  <button
                    type="button"
                    className="dashq-account-logout"
                    onClick={logout}
                  >
                    <i className="bi bi-box-arrow-right" />
                    Log out
                  </button>
                </section>
              )}
            </div>
          </div>
        </header>
        <div className="dashq-main-content">{children}</div>
      </main>
    </div>
  );
}
