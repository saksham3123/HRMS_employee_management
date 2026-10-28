export default function DashboardOverview({
  user,
  visibleStats,
  visibleModules,
  search,
  onSearchChange,
  onOpenModule,
}) {
  return (
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
              onChange={(event) => onSearchChange(event.target.value)}
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
                    onClick={() => onOpenModule(item.key)}
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
              No implemented feature matches your search, or your account has
              not been assigned access to one yet.
            </p>
          </div>
        )}
      </section>
      <p className="dashq-disclaimer">
        <i className="bi bi-info-circle" /> The backend continues to enforce
        permissions for every data request.
      </p>
    </>
  );
}
