import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../dashboard/Dashboard.css";
import {
  clearPlatformSession,
  getPlatformAdmin,
} from "../../services/platformService";

export const platformNavigation = [
  { key: "overview", label: "Overview", icon: "bi-grid-1x2" },
  { key: "companies", label: "Companies", icon: "bi-buildings" },
];

// Same look as the company DashboardLayout, with platform navigation.
export default function PlatformLayout({ children, activeItem, onNavigate }) {
  const navigate = useNavigate();
  const admin = getPlatformAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initial = (admin?.name || "P").slice(0, 1).toUpperCase();
  const activeLabel =
    platformNavigation.find((item) => item.key === activeItem)?.label ?? activeItem;

  const handleLogout = () => {
    clearPlatformSession();
    navigate("/platform/login", { replace: true });
  };

  return (
    <div className="dashq-shell">
      {mobileOpen && (
        <button
          className="dashq-mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`dashq-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="dashq-brand">
          <span className="dashq-brand-mark">
            <i className="bi bi-layers-half" />
          </span>
          <span>
            People<span className="dashq-brand-light">Desk</span>
            <small>PLATFORM ADMIN</small>
          </span>
        </div>

        <div className="dashq-nav-caption">PLATFORM</div>

        <nav className="dashq-nav" aria-label="Platform navigation">
          {platformNavigation.map((item) => (
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

        <div className="dashq-sidebar-bottom">
          <div className="dashq-help-icon">
            <i className="bi bi-shield-lock" />
          </div>
          <div>
            <strong>Privacy first</strong>
            <p>Only company details and counts are shown here.</p>
          </div>
        </div>

        <div className="dashq-sidebar-user">
          <div className="dashq-avatar">{initial}</div>
          <div className="dashq-user-copy">
            <strong>{admin?.name || "Platform admin"}</strong>
            <span>Super admin</span>
          </div>
          <button
            type="button"
            title="Log out"
            aria-label="Log out"
            className="dashq-logout"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right" />
          </button>
        </div>
      </aside>

      <main className="dashq-main">
        <header className="dashq-topbar">
          <button
            className="dashq-menu-toggle"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <i className="bi bi-list" />
          </button>

          <div className="dashq-breadcrumb">
            Platform <i className="bi bi-chevron-right" /> <strong>{activeLabel}</strong>
          </div>

          <div className="dashq-top-actions">
            <span className="dashq-status">
              <span /> System operational
            </span>
            <span className="dashq-top-avatar" title={admin?.email}>
              {initial}
            </span>
          </div>
        </header>

        <div className="dashq-main-content">{children}</div>
      </main>
    </div>
  );
}
