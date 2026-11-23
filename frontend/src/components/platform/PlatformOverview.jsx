// Overview page: headline numbers + most recent companies.
export default function PlatformOverview({
  admin,
  overview,
  organizations,
  loading,
  error,
  onOpenCompanies,
}) {
  const stats = [
    {
      key: "companies",
      title: "Total companies",
      value: overview?.organizations?.total ?? "—",
      icon: "bi-buildings",
      color: "blue",
      foot: "All companies on PeopleDesk",
    },
    {
      key: "active",
      title: "Active",
      value: overview?.organizations?.active ?? "—",
      icon: "bi-check2-circle",
      color: "green",
      foot: "Can use the HRMS",
    },
    {
      key: "suspended",
      title: "Suspended",
      value: overview?.organizations?.suspended ?? "—",
      icon: "bi-pause-circle",
      color: "orange",
      foot: "Blocked from logging in",
    },
    {
      key: "employees",
      title: "Total employees",
      value: overview?.totalEmployees ?? "—",
      icon: "bi-people",
      color: "blue",
      foot: `${overview?.totalUsers ?? "—"} user accounts`,
    },
  ];

  const recent = organizations.slice(0, 5);

  return (
    <>
      <div className="dashq-page-heading">
        <div>
          <div className="dashq-eyebrow">PLATFORM / OVERVIEW</div>
          <h1>Welcome back, {admin?.name?.split(" ")[0] || "there"}!</h1>
          <p>Here’s how PeopleDesk is doing across all companies.</p>
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

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="dashq-stat-grid" aria-label="Platform totals">
        {stats.map((item) => (
          <article className="dashq-stat-card" key={item.key}>
            <div className={`dashq-stat-icon ${item.color}`}>
              <i className={`bi ${item.icon}`} />
            </div>
            <div className="dashq-stat-label">{item.title}</div>
            <div className="dashq-stat-value">{loading ? "…" : item.value}</div>
            <div className="dashq-stat-foot">
              <span className="dashq-dot" /> {item.foot}
            </div>
          </article>
        ))}
      </section>

      <section className="dashq-content-panel">
        <div className="dashq-panel-heading">
          <div>
            <h2>Recently added companies</h2>
            <p>The five newest companies on the platform.</p>
          </div>
          <button type="button" className="dashq-open-button" onClick={onOpenCompanies}>
            Manage companies <i className="bi bi-arrow-up-right" />
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-slate-500">Loading…</p>
        ) : recent.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">Plan</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Employees</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((org) => (
                  <tr key={org.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-900">{org.name}</div>
                      <div className="text-xs text-slate-500">{org.slug}</div>
                    </td>
                    <td className="px-3 py-3 capitalize">{org.plan}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={org.status} />
                    </td>
                    <td className="px-3 py-3">{org.employee_count}</td>
                    <td className="px-3 py-3">{formatDate(org.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dashq-empty-state">
            <i className="bi bi-buildings" />
            <h3>No companies yet</h3>
            <p>Create the first company from the Companies page.</p>
          </div>
        )}
      </section>
    </>
  );
}

export function StatusBadge({ status }) {
  const active = status === "active";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
      }`}
    >
      {active ? "Active" : "Suspended"}
    </span>
  );
}

export function formatDate(date) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
