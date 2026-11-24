
import { useEffect, useState } from "react";
import departmentService from "../../../services/departmentServices";
import DepartmentForm from "./DepartmentForm";
import DepartmentTable from "./DepartmentTable";
import { confirmAction } from "../../../utils/confirmAction";
import Modal from "../../common/Modal";

const getDepartments = async () => {
  const response = await departmentService.getAll();
  return Array.isArray(response)
    ? response
    : response.departments || response.data || [];
};

function Departments({
  canView = true,
  canCreate = false,
  canEdit = false,
  canDelete = false,
}) {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchDepartments = async () => {
    try {
      setDepartments(await getDepartments());
    } catch (err) {
      setError(err.message || "Failed to load departments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return undefined;
    let active = true;

    getDepartments()
      .then((data) => {
        if (active) setDepartments(data);
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load departments.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canView]);

  const handleCreate = () => {
    setSelectedDepartment(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleEdit = (department) => {
    setSelectedDepartment(department);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (selectedDepartment) {
        await departmentService.update(
          selectedDepartment.id,
          formData
        );

        setSuccess("Department updated successfully.");
      } else {
        await departmentService.create(formData);

        setSuccess("Department created successfully.");
      }

      setShowForm(false);
      setSelectedDepartment(null);

      setLoading(true);
      await fetchDepartments();
    } catch (err) {
      setError(err.message || "Failed to save department.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (department) => {
    const confirmed = await confirmAction({
      title: `Delete ${department.name}?`,
      text: "This department will be removed. This can't be undone.",
      confirmText: "Delete",
      tone: "danger",
    });

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await departmentService.delete(department.id);

      setSuccess("Department deleted successfully.");

      setLoading(true);
      await fetchDepartments();
    } catch (err) {
      setError(err.message || "Failed to delete department.");
    }
  };

  if (!canView) {
    return (
      <p className="p-6 text-center text-red-500">
        You don't have permission to view departments.
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
            + Add Department
          </button>
        )}
      </div>

      {error && !showForm && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <Modal
        open={showForm}
        title={selectedDepartment ? "Edit department" : "Add department"}
        description="Departments group people for reporting and headcount."
        onClose={() => setShowForm(false)}
        busy={saving}
      >
        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <DepartmentForm
          key={selectedDepartment?.id ?? "new"}
          department={selectedDepartment}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          loading={saving}
        />
      </Modal>

      <DepartmentTable
        departments={departments}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={canEdit}
        canDelete={canDelete}
        loading={loading}
      />

    </div>
  );
}

export default Departments;
