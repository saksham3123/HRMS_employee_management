import { useEffect, useState } from "react";
import { getOrganization } from "../../services/platformService";
import { StatusBadge, formatDate } from "./PlatformOverview";

// Company details: profile fields and COUNTS only, never employee data.
export default function OrganizationDetails({ organizationId, refreshKey, onClose }) {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getOrganization(organizationId)
      .then((data) => {
        if (active) setOrganization(data);
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load company.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [organizationId, refreshKey]);

  const counts = organization
    ? [
        { label: "User accounts", value: organization.user_count },
        { label: "Active users", value: organization.active_user_count },
        { label: "Employees", value: organization.employee_count },
        { label: "Departments", value: organization.department_count },
        { label: "Designations", value: organization.designation_count },
      ]
    : [];

  return (
    <section className="dashq-content-panel">
      <div className="dashq-panel-heading">
        <div>
          <h2>{organization?.name ?? "Company details"}</h2>
          <p>{organization ? `Slug: ${organization.slug}` : "Loading…"}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="bi bi-x-lg" /> Close
        </button>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {loading && !organization && <p className="py-6 text-center text-slate-500">Loading…</p>}

      {organization && (
        <>
          <div className="mb-6 flex flex-wrap gap-6 text-sm">
            <div>
              <div className="text-slate-500">Status</div>
              <div className="mt-1">
                <StatusBadge status={organization.status} />
              </div>
            </div>
            <div>
              <div className="text-slate-500">Plan</div>
              <div className="mt-1 font-semibold capitalize text-slate-900">{organization.plan}</div>
            </div>
            <div>
              <div className="text-slate-500">Created</div>
              <div className="mt-1 font-semibold text-slate-900">
                {formatDate(organization.created_at)}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Last updated</div>
              <div className="mt-1 font-semibold text-slate-900">
                {formatDate(organization.updated_at)}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {counts.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 p-4">
                <div className="text-xs text-slate-500">{item.label}</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{item.value}</div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-slate-400">
            <i className="bi bi-shield-lock" /> Employee names and personal data are not
            available to platform admins.
          </p>
        </>
      )}
    </section>
  );
}
