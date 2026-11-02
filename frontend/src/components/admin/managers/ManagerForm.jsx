
import { useState } from "react";

function ManagerForm({
  employees = [],
  selectedAssignment = null,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    employeeId: selectedAssignment?.employee_id
      ? String(selectedAssignment.employee_id)
      : "",
    managerEmployeeId: selectedAssignment?.manager_employee_id
      ? String(selectedAssignment.manager_employee_id)
      : "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !formData.employeeId ||
      !formData.managerEmployeeId ||
      formData.employeeId === formData.managerEmployeeId
    ) {
      return;
    }

    onSubmit({
      employeeId: Number(formData.employeeId),
      managerEmployeeId: Number(formData.managerEmployeeId),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">
          Employee
        </label>

        <select
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
          required
          disabled={!!selectedAssignment}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="">Select employee</option>

          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name} ({employee.employee_number})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Reporting Manager
        </label>

        <select
          name="managerEmployeeId"
          value={formData.managerEmployeeId}
          onChange={handleChange}
          required
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="">Select manager</option>

          {employees
            .filter(
              (employee) =>
                String(employee.id) !== formData.employeeId
            )
            .map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} ({employee.employee_number})
              </option>
            ))}
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : selectedAssignment
              ? "Update Manager"
              : "Assign Manager"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-4 py-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default ManagerForm;
