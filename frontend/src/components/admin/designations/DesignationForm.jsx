
import { useState } from "react";

const initialForm = {
  title: "",
  description: "",
};

function DesignationForm({
  designation = null,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    title: designation?.title ?? initialForm.title,
    description: designation?.description ?? initialForm.description,
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

    if (!formData.title.trim()) return;

    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="designation-name"
          className="mb-1 block text-sm font-medium"
        >
          Designation Name
        </label>

        <input
          id="designation-name"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="e.g. Software Engineer"
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label
          htmlFor="designation-description"
          className="mb-1 block text-sm font-medium"
        >
          Description
        </label>

        <textarea
          id="designation-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="Designation responsibilities"
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : designation
              ? "Update Designation"
              : "Create Designation"}
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

export default DesignationForm;
