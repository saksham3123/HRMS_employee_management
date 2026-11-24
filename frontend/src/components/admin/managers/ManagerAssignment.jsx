import { useEffect, useState } from "react";
import managerService from "../../../services/managerServices";
import { getAllEmployees } from "../../../services/adminService";
import ManagerForm from "./ManagerForm";
import ManagerTable from "./ManagerTable";
import { confirmAction } from "../../../utils/confirmAction";
import Modal from "../../common/Modal";

const loadManagerData = async () => {
  const data = await getAllEmployees();
  const employees = (data.users ?? [])
    .filter((user) => user.employee_id && user.name)
    .map((user) => ({
      id: user.employee_id,
      name: user.name,
      employee_number: user.employee_number,
    }));

  const results = await Promise.all(
    employees.map(async (employee) => {
      const response = await managerService.getEmployeeManager(employee.id);
      const reporting = response.reporting ?? response.manager ?? response;

      if (!reporting.manager_employee_id) return null;

      return {
        employee_id: employee.id,
        employee_name: employee.name,
        manager_employee_id: reporting.manager_employee_id,
        manager_name:
          reporting.manager_name || reporting.manager?.name || "—",
      };
    })
  );

  return { employees, assignments: results.filter(Boolean) };
};

function ManagerAssignment({
  canView = true,
  canCreate = false,
  canEdit = false,
  canDelete = false,
}) {
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      const result = await loadManagerData();
      setEmployees(result.employees);
      setAssignments(result.assignments);
    } catch (requestError) {
      setError(requestError.message || "Failed to load manager data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return undefined;
    let active = true;

    loadManagerData()
      .then((result) => {
        if (!active) return;
        setEmployees(result.employees);
        setAssignments(result.assignments);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || "Failed to load manager data.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canView]);

  const handleCreate = () => {
    setSelectedAssignment(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleEdit = (assignment) => {
    setSelectedAssignment(assignment);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async ({ employeeId, managerEmployeeId }) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (selectedAssignment) {
        await managerService.updateManager(employeeId, managerEmployeeId);
        setSuccess("Reporting manager updated successfully.");
      } else {
        await managerService.assignManager(employeeId, managerEmployeeId);
        setSuccess("Reporting manager assigned successfully.");
      }

      setShowForm(false);
      setSelectedAssignment(null);
      setLoading(true);
      await fetchData();
    } catch (requestError) {
      setError(requestError.message || "Failed to save manager assignment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assignment) => {
    const confirmed = await confirmAction({
      title: "Remove reporting manager?",
      text: `${assignment.employee_name} will no longer report to ${assignment.manager_name}.`,
      confirmText: "Remove",
      tone: "danger",
    });

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      await managerService.removeManager(assignment.employee_id);
      setSuccess("Reporting manager removed successfully.");
      setLoading(true);
      await fetchData();
    } catch (requestError) {
      setError(requestError.message || "Failed to remove reporting manager.");
    }
  };

  if (!canView) {
    return (
      <p className="p-6 text-center text-red-500">
        You don't have permission to view reporting managers.
      </p>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* The page title comes from the dashboard shell. */}
      <div className="flex flex-wrap items-center justify-end gap-4">
        {canCreate && (
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Assign Manager
          </button>
        )}
      </div>

      {error && !showForm && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <Modal
        open={showForm}
        title={selectedAssignment ? "Change reporting manager" : "Assign reporting manager"}
        description="Choose who this employee reports to."
        onClose={() => setShowForm(false)}
        busy={saving}
      >
        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <ManagerForm
          key={selectedAssignment?.employee_id ?? "new"}
          employees={employees}
          selectedAssignment={selectedAssignment}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          loading={saving}
        />
      </Modal>

      <ManagerTable
        assignments={assignments}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={canEdit}
        canDelete={canDelete}
        loading={loading}
      />
    </div>
  );
}

export default ManagerAssignment;
