import { useState } from "react";
import { createPlan, updatePlan, updatePlanStatus } from "../../services/platformService";
import { formatRupees } from "../../services/publicService";
import { confirmAction } from "../../utils/confirmAction";
import Modal from "../common/Modal";

// Platform admins create and edit the subscription plans shown on the
// public landing page and offered to companies.

const emptyForm = {
  code: "",
  name: "",
  description: "",
  price_monthly: "0",
  price_yearly: "0",
  max_employees: "",
  features: "",
  is_featured: false,
  sort_order: "0",
};

const toForm = (plan) => ({
  code: plan.code,
  name: plan.name,
  description: plan.description ?? "",
  price_monthly: String(plan.price_monthly),
  price_yearly: String(plan.price_yearly),
  max_employees: plan.max_employees == null ? "" : String(plan.max_employees),
  features: (plan.features ?? []).join("\n"),
  is_featured: plan.is_featured,
  sort_order: String(plan.sort_order),
});

const toPayload = (form) => ({
  name: form.name.trim(),
  description: form.description.trim(),
  price_monthly: Number(form.price_monthly),
  price_yearly: Number(form.price_yearly),
  max_employees: form.max_employees.trim() === "" ? null : Number(form.max_employees),
  features: form.features.split("\n").map((line) => line.trim()).filter(Boolean),
  is_featured: form.is_featured,
  sort_order: Number(form.sort_order),
});

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function PlansManager({ plans, loading, onChanged }) {
  // null: no form; "new": creating; otherwise the plan being edited.
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const openForm = (plan) => {
    setEditing(plan ?? "new");
    setForm(plan ? toForm(plan) : emptyForm);
    setError("");
    setSuccess("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editing === "new") {
        await createPlan({ ...toPayload(form), code: form.code.trim().toLowerCase() });
        setSuccess(`${form.name.trim()} created.`);
      } else {
        await updatePlan(editing.id, toPayload(form));
        setSuccess(`${form.name.trim()} saved.`);
      }
      setEditing(null);
      await onChanged();
    } catch (err) {
      setError(err.message || "Couldn't save the plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (plan) => {
    const hiding = plan.is_active;
    const confirmed = await confirmAction(
      hiding
        ? {
            title: `Stop offering ${plan.name}?`,
            text:
              plan.organization_count > 0
                ? `It disappears from the landing page and can't be given to new companies. The ${plan.organization_count} ${plan.organization_count === 1 ? "company" : "companies"} on it keep it.`
                : "It disappears from the landing page and can't be given to companies.",
            confirmText: "Stop offering",
            tone: "danger",
          }
        : {
            title: `Offer ${plan.name} again?`,
            text: "It shows on the landing page and can be given to companies.",
            confirmText: "Offer plan",
          }
    );

    if (!confirmed) return;

    setBusyId(plan.id);
    setError("");
    setSuccess("");
    try {
      await updatePlanStatus(plan.id, !plan.is_active);
      setSuccess(hiding ? `${plan.name} is no longer offered.` : `${plan.name} is offered again.`);
      await onChanged();
    } catch (err) {
      setError(err.message || "Couldn't update the plan.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="dashq-page-heading">
        <div>
          <h1>Plans</h1>
          <p>The subscription plans companies can buy. Active plans show on the landing page.</p>
        </div>
                  <button
          type="button"
          onClick={() => openForm(null)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <i className="bi bi-plus-lg" aria-hidden="true" /> New plan
        </button>
      </div>

      {error && !editing && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </p>
      )}

      <Modal
        open={Boolean(editing)}
        title={editing === "new" ? "New plan" : `Edit ${editing?.name ?? "plan"}`}
        description="Prices are in whole rupees. Leave the employee limit empty for unlimited."
        onClose={() => setEditing(null)}
        busy={saving}
        size="lg"
      >
        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="plan-name" className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                <input id="plan-name" name="name" value={form.name} onChange={handleChange} required maxLength={60} className={inputClass} />
              </div>
              <div>
                <label htmlFor="plan-code" className="mb-1 block text-sm font-medium text-slate-700">Code</label>
                <input
                  id="plan-code"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={30}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  disabled={editing !== "new"}
                  aria-describedby="plan-code-hint"
                  className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}
                />
                <p id="plan-code-hint" className="mt-1 text-xs text-slate-600">
                  {editing === "new"
                    ? "Lowercase letters, numbers and hyphens. Can't be changed later."
                    : "Fixed: companies on this plan reference it."}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="plan-description" className="mb-1 block text-sm font-medium text-slate-700">Short description</label>
                <input id="plan-description" name="description" value={form.description} onChange={handleChange} maxLength={255} className={inputClass} />
              </div>
              <div>
                <label htmlFor="plan-monthly" className="mb-1 block text-sm font-medium text-slate-700">Monthly price (₹)</label>
                <input id="plan-monthly" name="price_monthly" type="number" min={0} step={1} value={form.price_monthly} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label htmlFor="plan-yearly" className="mb-1 block text-sm font-medium text-slate-700">Yearly price (₹)</label>
                <input id="plan-yearly" name="price_yearly" type="number" min={0} step={1} value={form.price_yearly} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label htmlFor="plan-limit" className="mb-1 block text-sm font-medium text-slate-700">Employee limit</label>
                <input id="plan-limit" name="max_employees" type="number" min={1} step={1} value={form.max_employees} onChange={handleChange} placeholder="Unlimited" className={inputClass} />
              </div>
              <div>
                <label htmlFor="plan-order" className="mb-1 block text-sm font-medium text-slate-700">Display order</label>
                <input id="plan-order" name="sort_order" type="number" step={1} value={form.sort_order} onChange={handleChange} required className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="plan-features" className="mb-1 block text-sm font-medium text-slate-700">Features (one per line)</label>
                <textarea id="plan-features" name="features" rows={5} value={form.features} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} className="h-4 w-4" />
              Highlight this plan on the landing page
            </label>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : editing === "new" ? "Create plan" : "Save plan"}
              </button>
            </div>
          </form>
      </Modal>

      <section className="dashq-content-panel" aria-labelledby="plans-heading">
        <div className="dashq-panel-heading">
          <div>
            <h2 id="plans-heading">All plans</h2>
            <p>{loading ? "Loading…" : `${plans.filter((plan) => plan.is_active).length} of ${plans.length} offered`}</p>
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-slate-500">Loading plans…</p>
        ) : plans.length === 0 ? (
          <p className="py-10 text-center text-slate-500">No plans yet. Create the first one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Plan</th>
                  <th className="px-3 py-2 text-right font-medium">Monthly</th>
                  <th className="px-3 py-2 text-right font-medium">Yearly</th>
                  <th className="px-3 py-2 font-medium">Employees</th>
                  <th className="px-3 py-2 text-right font-medium">Companies</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-900">
                        {plan.name}
                        {plan.is_featured && (
                          <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">Highlighted</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">{plan.code}</div>
                    </td>
                    <td className="px-3 py-3 text-right">{formatRupees(plan.price_monthly)}</td>
                    <td className="px-3 py-3 text-right">{formatRupees(plan.price_yearly)}</td>
                    <td className="px-3 py-3">{plan.max_employees ? `Up to ${plan.max_employees}` : "Unlimited"}</td>
                    <td className="px-3 py-3 text-right">{plan.organization_count}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          plan.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {plan.is_active ? "Offered" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openForm(plan)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggle(plan)}
                          disabled={busyId === plan.id}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50 ${
                            plan.is_active
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-green-200 text-green-700 hover:bg-green-50"
                          }`}
                        >
                          {plan.is_active ? "Stop offering" : "Offer again"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
