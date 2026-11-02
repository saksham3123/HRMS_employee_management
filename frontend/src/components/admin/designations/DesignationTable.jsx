function DesignationTable({
  designations = [],
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
            <th className="px-4 py-3 font-semibold">ID</th>
            <th className="px-4 py-3 font-semibold">Designation</th>
            <th className="px-4 py-3 font-semibold">Description</th>
            <th className="px-4 py-3 font-semibold">Employees</th>
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
                Loading designations...
              </td>
            </tr>
          ) : designations.length === 0 ? (
            <tr>
              <td
                colSpan={hasActions ? 5 : 4}
                className="px-4 py-8 text-center text-slate-500"
              >
                No designations found.
              </td>
            </tr>
          ) : (
            designations.map((designation) => (
              <tr key={designation.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{designation.id}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {designation.title}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {designation.description || "—"}
                </td>
                <td className="px-4 py-3">
                  {designation.employee_count ?? 0}
                </td>
                {hasActions && (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit?.(designation)}
                          className="rounded-lg border border-blue-200 px-3 py-1 text-blue-700 hover:bg-blue-50"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete?.(designation)}
                          className="rounded-lg border border-red-200 px-3 py-1 text-red-600 hover:bg-red-50"
                        >
                          Delete
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

export default DesignationTable;
