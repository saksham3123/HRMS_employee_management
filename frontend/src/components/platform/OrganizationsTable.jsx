import { useState } from "react";
import DataTable, { Column } from "datatables.net-react";
import DtCore from "datatables.net-dt";
import "datatables.net-dt/css";
import {
  updateOrganizationPlan,
  updateOrganizationStatus,
} from "../../services/platformService";
import { confirmAction } from "../../utils/confirmAction";
import { StatusBadge, formatDate } from "./PlatformOverview";

// DataTables requires registering its engine at module scope.
// eslint-disable-next-line react-hooks/rules-of-hooks
DataTable.use(DtCore);

// Each row's controls keep their own state. DataTables draws a cell once,
// so state kept in the parent wouldn't reach the cell after it's drawn
// (same reason as RoleEditor in EmployeeList).
function OrganizationActions({ organization, plans, onChanged, onError }) {
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

  const planName = (code) => plans.find((option) => option.code === code)?.name ?? code;
  // A company can stay on a plan that's no longer offered; keep it selectable.
  const options = plans.some((option) => option.code === organization.plan)
    ? plans
    : [{ code: organization.plan, name: `${organization.plan} (not offered)` }, ...plans];

  const handlePlan = async () => {
    const confirmed = await confirmAction({
      title: `Move ${organization.name} to ${planName(plan)}?`,
      text: `The plan on record changes from ${planName(organization.plan)} to ${planName(plan)}.`,
      confirmText: `Change to ${planName(plan)}`,
    });

    if (confirmed) {
      run(() => updateOrganizationPlan(organization.id, plan));
    } else {
      setPlan(organization.plan);
    }
  };

  const handleStatus = async () => {
    const nextStatus = isActive ? "suspended" : "active";
    const confirmed = await confirmAction(
      isActive
        ? {
            title: `Suspend ${organization.name}?`,
            text: "Its users won't be able to log in until the company is reactivated.",
            confirmText: "Suspend",
            tone: "danger",
          }
        : {
            title: `Reactivate ${organization.name}?`,
            text: "Its users will be able to log in again.",
            confirmText: "Reactivate",
          }
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
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handlePlan}
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

export default function OrganizationsTable({ organizations, plans = [], onChanged, onView, onError }) {
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
      <Column
        title="Plan"
        data="plan"
        render={(plan, type) =>
          type === "display"
            ? plans.find((option) => option.code === plan)?.name ?? plan ?? "—"
            : plan
        }
      />
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
            plans={plans}
            onChanged={onChanged}
            onError={onError}
          />
        )}
      </Column>
    </DataTable>
  );
}
