
import { useState } from "react";

export default function CreateEmployeeForm({
  onCreate,
  creating = false,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      await onCreate({ name, email, password, role });

      setSuccess("User account created successfully.");
      setName("");
      setEmail("");
      setPassword("");
      setRole("employee");
    } catch (err) {
      setError(err.message || "Failed to create employee account.");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          Create User Account
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Register a new user account and assign a role.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="employee-name"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Full name
          </label>
          <input
            id="employee-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Enter employee name"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="employee-email"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Email address
          </label>
          <input
            id="employee-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="user@example.com"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="employee-role"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Role
          </label>
          <select
            id="employee-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="hr">HR</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="employee-password"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Temporary password
          </label>
          <input
            id="employee-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="text-sm text-green-700">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create User"}
        </button>
      </form>
    </section>
  );
}
