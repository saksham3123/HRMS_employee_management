import { useState } from "react";
import { PLANS } from "../../services/platformService";

const initialForm = {
  name: "",
  slug: "",
  plan: "free",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

// "Acme Labs Pvt Ltd" -> "acme-labs-pvt-ltd"
const toSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function CreateOrganizationForm({ onSubmit, onCancel, saving = false }) {
  const [form, setForm] = useState(initialForm);
  // Keep auto-filling the slug from the name until the user edits the slug.
  const [slugEdited, setSlugEdited] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => {
      const next = { ...previous, [name]: value };
      if (name === "name" && !slugEdited) next.slug = toSlug(value);
      return next;
    });

    if (name === "slug") setSlugEdited(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      plan: form.plan,
      admin: {
        name: form.adminName.trim(),
        email: form.adminEmail.trim(),
        password: form.adminPassword,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="text-sm font-semibold text-slate-900">Company</div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="org-name" className="mb-1 block text-sm font-medium text-slate-700">
              Company name
            </label>
            <input
              id="org-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Test Company"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="org-slug" className="mb-1 block text-sm font-medium text-slate-700">
              Slug
            </label>
            <input
              id="org-slug"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={60}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Lowercase letters, numbers and single hyphens"
              placeholder="test-company"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-500">
              Lowercase letters, numbers and hyphens. Used for the company’s URL later.
            </p>
          </div>

          <div>
            <label htmlFor="org-plan" className="mb-1 block text-sm font-medium text-slate-700">
              Plan
            </label>
            <select
              id="org-plan"
              name="plan"
              value={form.plan}
              onChange={handleChange}
              className={`${inputClass} bg-white capitalize`}
            >
              {PLANS.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-6">
        <div className="text-sm font-semibold text-slate-900">
          First admin of this company
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="admin-name" className="mb-1 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="admin-name"
              name="adminName"
              value={form.adminName}
              onChange={handleChange}
              required
              placeholder="e.g. Priya Sharma"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="admin-email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="admin-email"
              name="adminEmail"
              type="email"
              value={form.adminEmail}
              onChange={handleChange}
              required
              placeholder="admin@company.com"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Temporary password
            </label>
            <input
              id="admin-password"
              name="adminPassword"
              type="password"
              value={form.adminPassword}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-500">
              Share it with the admin securely. They log in at /login.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create company"}
        </button>
      </div>
    </form>
  );
}
