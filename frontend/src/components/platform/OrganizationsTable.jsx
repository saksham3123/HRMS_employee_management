import { useState } from "react";
import DataTable, { Column } from "datatables.net-react";
import DtCore from "datatables.net-dt";
import "datatables.net-dt/css";
import {
  PLANS,
  updateOrganizationPlan,
  updateOrganizationStatus,
} from "../../services/platformService";
import { StatusBadge, formatDate } from "./PlatformOverview";

// DataTables requires registering its engine at module scope.
// eslint-disable-next-line react-hooks/rules-of-hooks
DataTable.use(DtCore);

// Each row's controls keep their own state. DataTables draws a cell once,
// so state kept in the parent wouldn't reach the cell after it's drawn
// (same reason as RoleEditor in EmployeeList).
function OrganizationActions({ organization, onChanged, onError }) {
  const [plan, setPlan] = useState(organization.plan);
  const [busy, setBusy] = useState(false);

  const isActive = organization.status === "active";

  const run = async (action) => {
    setBusy(true);
    try {
      await action();
      await onChanged();
    } catch (err) {
      onError(err.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleStatus = () => {
    const nextStatus = isActive ? "suspended" : "active";
    const confirmed = window.confirm(
      isActive
        ? `Suspend ${organization.name}? Its users won't be able to log in until it is reactivated.`
        : `Reactivate ${organization.name}?`
    );

    if (confirmed) {
      run(() => updateOrganizationStatus(organization.id, nextStatus));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label={`Plan for ${organization.name}`}
        value={plan}
        onChange={(event) => setPlan(event.target.value)}
        disabled={busy}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm capitalize"
      >
        {PLANS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => run(() => updateOrganizationPlan(organization.id, plan))}
        disabled={busy || plan === organization.plan}
        className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Save plan
      </button>

      <button
        type="button"
        onClick={handleStatus}
        disabled={busy}
        className={`rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
          isActive
            ? "border-red-200 text-red-600 hover:bg-red-50"
            : "border-green-200 text-green-700 hover:bg-green-50"
        }`}
      >
        {busy ? "Saving..." : isActive ? "Suspend" : "Reactivate"}
      </button>

    </div>
  );
}

export default function OrganizationsTable({ organizations, onChanged, onView, onError }) {
  return (
    <DataTable
      data={organizations}
      className="display nowrap w-full"
      options={{
        scrollX: true,
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        order: [[5, "desc"]],
        language: { emptyTable: "No companies yet." },
      }}
    >
      <Column title="Company" data="name">
        {(name, _type, row) => (
          <button
            type="button"
            onClick={() => onView(row.id)}
            className="text-left hover:underline"
            title="View company details"
          >
            <span className="font-semibold text-blue-700">{name}</span>
            <span className="block text-xs text-slate-500">{row.slug}</span>
          </button>
        )}
      </Column>
      <Column title="Plan" data="plan" render={(plan) => plan ?? "—"} />
      <Column title="Status" data="status" orderable={false} searchable={false}>
        {(status) => <StatusBadge status={status} />}
      </Column>
      <Column title="Users" data="user_count" />
      <Column title="Employees" data="employee_count" />
      <Column
        title="Created"
        data="created_at"
        render={(date, type) => (type === "display" ? formatDate(date) : date)}
      />
      <Column title="Actions" data="id" orderable={false} searchable={false}>
        {(id, _type, row) => (
          <OrganizationActions
            organization={row}
            onChanged={onChanged}
            onError={onError}
          />
        )}
      </Column>
    </DataTable>
  );
}
