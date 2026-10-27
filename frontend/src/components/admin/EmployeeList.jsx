export default function EmployeeList({
  employees = [],
  loading = false,
  onDelete,
  deletingId = null,
}) {
  const canDelete = typeof onDelete === "function";

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-162.5 text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canDelete && (
                <th className="px-4 py-3 font-medium">Action</th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canDelete ? 6 : 5} className="px-4 py-10 text-center text-slate-500">
                  Loading employees...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={canDelete ? 6 : 5} className="px-4 py-10 text-center text-slate-500">
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {employee.name}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {employee.email}
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                     {employee.roles?.join(", ") || "No role"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {formatDate(employee.createdAt)}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${employee.is_active
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                        }`}
                    >
                      {employee.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {canDelete && (
                    <td className="px-4 py-4">
                      {employee.roles?.includes("admin") ? (
                        <span className="text-xs text-slate-400">
                          Protected account
                        </span>
                      ) : !employee.is_active ? (
                        <span className="text-xs text-slate-400">
                          Deactivated
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDelete(employee)}
                          disabled={deletingId === employee.id}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === employee.id
                            ? "Deactivating..."
                            : "Deactivate"}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}