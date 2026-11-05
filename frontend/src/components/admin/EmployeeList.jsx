
import { useState } from "react";
import DataTable, { Column } from "datatables.net-react";
import DtCore from "datatables.net-dt";
import "datatables.net-dt/css";
import "datatables.net-responsive-dt";
import "datatables.net-responsive-dt/css";

// DataTables requires registering its engine at module scope.
// eslint-disable-next-line react-hooks/rules-of-hooks
DataTable.use(DtCore);

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
  const [roleDrafts, setRoleDrafts] = useState({});

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

  const handleDelete = (employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${employee.name}'s account?`
    );

    if (confirmed) {
      onDelete(employee.id);
    }
  };

  const handleRoleSave = async (employee) => {
    const role =
      roleDrafts[employee.id] ??
      employee.roles?.[0] ??
      "employee";

    await onRoleChange(employee.employee_id, role, employee.id);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          Employee Management
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
            className="display w-full"
            options={{
              responsive: true,
              pageLength: 10,
              lengthMenu: [5, 10, 25, 50],
              order: [[0, "asc"]],
              language: {
                emptyTable: "No employees found.",
              },
            }}
          >
            <Column
              data="name"
              title="Name"
            />

            <Column
              data="email"
              title="Email"
            />

            <Column
              title="Role"
              data="id"
              orderable={false}
              searchable={false}
            >
              {(id, _type, row) =>
                canEditRole && row.employee_id ? (
                  <select
                    aria-label={`Role for ${row.name}`}
                    value={
                      roleDrafts[row.id] ??
                      row.roles?.[0] ??
                      "employee"
                    }
                    onChange={(event) =>
                      setRoleDrafts((previous) => ({
                        ...previous,
                        [row.id]: event.target.value,
                      }))
                    }
                    disabled={updatingRoleId === row.id}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>
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
              title="Status"
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
                    {canEditRole && row.employee_id && (
                      <button
                        type="button"
                        onClick={() => handleRoleSave(row)}
                        disabled={
                          updatingRoleId === row.id ||
                          (roleDrafts[row.id] ??
                            row.roles?.[0] ??
                            "employee") === row.roles?.[0]
                        }
                        className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingRoleId === row.id
                          ? "Saving..."
                          : "Save role"}
                      </button>
                    )}

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
