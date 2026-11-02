function ManagerTable({
  assignments = [],
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  loading = false,
}) {
  const hasActions = canEdit || canDelete;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-150 text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Employee ID</th>
            <th className="px-4 py-3 font-semibold">Employee Name</th>
            <th className="px-4 py-3 font-semibold">Manager ID</th>
            <th className="px-4 py-3 font-semibold">Manager Name</th>
            {hasActions && <th className="px-4 py-3 font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={hasActions ? 5 : 4}
                className="px-4 py-8 text-center text-slate-500"
              >
                Loading manager assignments...
              </td>
            </tr>
          ) : assignments.length === 0 ? (
            <tr>
              <td
                colSpan={hasActions ? 5 : 4}
                className="px-4 py-8 text-center text-slate-500"
              >
                No reporting manager assignments found.
              </td>
            </tr>
          ) : (
            assignments.map((assignment) => (
              <tr
                key={assignment.employee_id}
                className="border-t border-slate-100"
              >
                <td className="px-4 py-3">{assignment.employee_id}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {assignment.employee_name}
                </td>
                <td className="px-4 py-3">
                  {assignment.manager_employee_id}
                </td>
                <td className="px-4 py-3">{assignment.manager_name || "—"}</td>
                {hasActions && (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit?.(assignment)}
                          className="rounded-lg border border-blue-200 px-3 py-1 text-blue-700 hover:bg-blue-50"
                        >
                          Change
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete?.(assignment)}
                          className="rounded-lg border border-red-200 px-3 py-1 text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ManagerTable;
