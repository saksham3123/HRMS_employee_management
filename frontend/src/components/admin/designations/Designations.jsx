import { useEffect, useState } from "react";
import designationService from "../../../services/designationService";
import DesignationForm from "./DesignationForm";
import DesignationTable from "./DesignationTable";

const getDesignations = async () => {
    const response = await designationService.getAll();
    return Array.isArray(response)
      ? response
      : response.designations || response.data || [];
};

function Designations({
    canView = true,
    canCreate = false,
    canEdit = false,
    canDelete = false,
}) {

    const [designations, setDesignations] = useState([]);
    const [selectedDesignation, setSelectedDesignation] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchDesignations = async () => {
        try {
            setDesignations(await getDesignations());

        } catch (err) {
            setError(err.message || "Failed to load designations.")
            
        }finally{
            setLoading(false)
        }
        
    }

    useEffect(() => {
      if (!canView) return undefined;
      let active = true;

      getDesignations()
        .then((data) => {
          if (active) setDesignations(data);
        })
        .catch((err) => {
          if (active) setError(err.message || "Failed to load designations.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [canView]);



    const handleCreate = () => {
    setSelectedDesignation(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  };



  const handleEdit = (designation) => {
    setSelectedDesignation(designation);
    setShowForm(true);
    setError("");
    setSuccess("");
  };


   const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (selectedDesignation) {
        await designationService.update(
          selectedDesignation.id,
          formData
        );

        setSuccess("Designation updated successfully.");
      } else {
        await designationService.create(formData);

        setSuccess("Designation created successfully.");
      }

      setShowForm(false);
      setSelectedDesignation(null);

      setLoading(true);
      await fetchDesignations();
    } catch (err) {
      setError(err.message || "Failed to save designation.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (designation) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${designation.title}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await designationService.delete(designation.id);

      setSuccess("Designation deleted successfully.");

      setLoading(true);
      await fetchDesignations();
    } catch (err) {
      setError(err.message || "Failed to delete designation.");
    }
  };

  if (!canView) {
    return (
      <p className="p-6 text-center text-red-500">
        You don't have permission to view designations.
      </p>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Designations
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your organization's designations.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Add Designation
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {showForm && (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            {selectedDesignation
              ? "Edit Designation"
              : "Create Designation"}
          </h2>

          <DesignationForm
            key={selectedDesignation?.id ?? "new"}
            designation={selectedDesignation}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            loading={saving}
          />
        </div>
      )}

      <DesignationTable
        designations={designations}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={canEdit}
        canDelete={canDelete}
        loading={loading}
      />
    </div>
    )
}

export default Designations