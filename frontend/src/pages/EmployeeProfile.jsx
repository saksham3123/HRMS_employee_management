
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/common/Sidebar";
import { getProfile, updateProfile } from "../services/profileService";

export default function EmployeeProfile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        const currentProfile = data.user ?? data.profile ?? data;

        setProfile(currentProfile);
        setForm({
          name: currentProfile.name ?? "",
          email: currentProfile.email ?? "",
        });
      } catch (err) {
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const data = await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
      });

      const updatedProfile = data.user ?? data.profile ?? data;

      setProfile((previous) => ({
        ...previous,
        ...updatedProfile,
        name: updatedProfile.name ?? form.name.trim(),
        email: updatedProfile.email ?? form.email.trim(),
      }));

      setEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Employee Portal
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              My Profile
            </h1>
            <p className="mt-2 text-slate-500">
              View and manage your personal information.
            </p>
          </header>

          {error && (
            <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="mb-5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
              {success}
            </p>
          )}

          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-slate-500 shadow-sm">
              Loading profile...
            </div>
          ) : profile ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                  {(form.name || user?.name || "E").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {profile.name || user?.name || "Employee"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {profile.email || user?.email}
                  </p>
                </div>
              </div>

              {!editing ? (
                <>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-slate-500">Full name</p>
                      <p className="mt-1 font-medium text-slate-900">{profile.name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Email address</p>
                      <p className="mt-1 font-medium text-slate-900">{profile.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Employee ID</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {profile.employee_number || profile.employeeNumber || "Not available"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Account status</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {profile.is_active ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        name: profile.name ?? "",
                        email: profile.email ?? "",
                      });
                      setError("");
                      setSuccess("");
                      setEditing(true);
                    }}
                    className="mt-8 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                </>
              ) : (
                <form onSubmit={handleSave} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                      Full name
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      minLength={2}
                      maxLength={100}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setEditing(false);
                        setForm({
                          name: profile.name ?? "",
                          email: profile.email ?? "",
                        });
                        setError("");
                      }}
                      className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>
          ) : (
            <div className="rounded-2xl bg-white p-8 text-slate-500 shadow-sm">
              Profile information could not be found.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
