import { useState } from "react";
import DataTable, { Column } from "datatables.net-react";
import DtCore from "datatables.net-dt";
import "datatables.net-dt/css";
import { confirmAction } from "../../utils/confirmAction";


// DataTables requires registering its engine at module scope.
// eslint-disable-next-line react-hooks/rules-of-hooks
DataTable.use(DtCore);




const ROLE_LABELS = {
  employee: "Employee",
  manager: "Manager",
  hr: "HR",
  admin: "Admin",
};

// Each row's role editor keeps its own state. DataTables renders a cell once,
// so state kept in EmployeeList wouldn't reach the cell after it's drawn.
function RoleEditor({ row, onRoleChange }) {
  const currentRole = row.roles?.[0] ?? "employee";
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const from = ROLE_LABELS[currentRole] ?? currentRole;
    const to = ROLE_LABELS[role] ?? role;
    const confirmed = await confirmAction({
      title: `Change ${row.name}'s role to ${to}?`,
      text:
        role === "admin"
          ? `${row.name} will go from ${from} to Admin and be able to manage every account, role and record in your organization.`
          : currentRole === "admin"
            ? `${row.name} will lose Admin access. Their new role is ${to}.`
            : `${row.name}'s role will change from ${from} to ${to}, along with what they can see and do.`,
      confirmText: `Change to ${to}`,
      tone: role === "admin" || currentRole === "admin" ? "danger" : "primary",
    });

    if (!confirmed) {
      setRole(currentRole);
      return;
    }

    setSaving(true);
    try {
      await onRoleChange(row.employee_id, role, row.id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label={`Role for ${row.name}`}
        value={role}
        onChange={(event) => setRole(event.target.value)}
        disabled={saving}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        <option value="employee">Employee</option>
        <option value="manager">Manager</option>
        <option value="hr">HR</option>
        <option value="admin">Admin</option>
      </select>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || role === currentRole}
        className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save role"}
      </button>
    </div>
  );
}

export default function EmployeeList({
  employees = [],
  loading = false,
  onDelete,
  deletingId = null,
  onRoleChange,
  updatingRoleId = null,
}) {
  const canDelete = typeof onDelete === "function";
  const canEditRole = typeof onRoleChange === "function";
 

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };



    // Show "—" for empty values (e.g. no department assigned yet).
  const orDash = (value) =>
    value === null || value === undefined || value === "" ? "—" : value;

  // "on_leave" -> "On leave"
  const formatStatus = (status) =>
    status
      ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")
      : "—";


  const handleDelete = async (employee) => {
    const confirmed = await confirmAction({
      title: `Deactivate ${employee.name}?`,
      text: `${employee.name} won't be able to log in to PeopleDesk until the account is reactivated.`,
      confirmText: "Deactivate",
      tone: "danger",
    });

    if (confirmed) {
      onDelete(employee.id);
    }
  };


  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          All employees
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          View and manage registered employee accounts.
        </p>
      </div>

      {loading ? (
        <p className="py-10 text-center text-slate-500">
          Loading employees...
        </p>
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            data={employees}
            className="display flex-nowrap w-full"
            options={{
              scrollX: true,
              pageLength: 10,
              lengthMenu: [5, 10, 25, 50],
              order: [[0, "asc"]],
              language: {
                emptyTable: "No employees found.",
              },
            }}
          >

            <Column
              data="employee_number"
              title="Emp. No."
              render={(value) => orDash(value)}
            />

            <Column
              data="name"
              title="Name"
            />

            <Column
              data="email"
              title="Email"
            />

            <Column
              data="phone"
              title="Phone"
              render={(value) => orDash(value)}
            />

            <Column
              data="department_name"
              title="Department"
              render={(value) => orDash(value)}
            />

            <Column
              data="designation_title"
              title="Designation"
              render={(value) => orDash(value)}
            />

            <Column
              title="Role"
              data="id"
              orderable={false}
              searchable={false}
            >
              {(id, _type, row) =>
                canEditRole && row.employee_id && row.is_active ? (
                  <RoleEditor row={row} onRoleChange={onRoleChange} />
                ) : (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {row.roles?.join(", ") || "No role"}
                  </span>
                )
              }
            </Column>

            <Column
              title="Joining Date"
              data="joining_date"
              render={(date) => formatDate(date)}
            />

             <Column
              title="Employment"
              data="employment_status"
              render={(status) => formatStatus(status)}
            />

            <Column
              title="Account"
              data="is_active"
              render={(active) =>
                active ? "Active" : "Inactive"
              }
            />

            {(canEditRole || canDelete) && (
              <Column
                title="Actions"
                data="id"
                orderable={false}
                searchable={false}
              >
                {(id, _type, row) => (
                  <div className="flex flex-wrap gap-2">
                   

                    {canDelete &&
                      (row.roles?.includes("admin") ? (
                        <span className="text-xs text-slate-400">
                          Protected account
                        </span>
                      ) : !row.is_active ? (
                        <span className="text-xs text-slate-400">
                          Deactivated
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          disabled={deletingId === row.id}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === row.id
                            ? "Deactivating..."
                            : "Deactivate"}
                        </button>
                      ))}
                  </div>
                )}
              </Column>
            )}
          </DataTable>
        </div>
      )}
    </section>
  );
}
