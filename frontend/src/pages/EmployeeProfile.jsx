
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { getProfile, updateProfile } from "../services/profileService";
import "../components/dashboard/Dashboard.css";

export default function EmployeeProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const handleNavigate = (item) => {
    if (item === "profile") return;

    navigate("/dashboard", {
      state: { dashboardModule: item },
    });
  };

  return (
    <DashboardLayout activeItem="profile" onNavigate={handleNavigate}>
      <div className="dashq-page-heading">
        <div>
          <div className="dashq-eyebrow">WORKSPACE / MY PROFILE</div>
          <h1>My Profile</h1>
          <p>View and manage your personal information.</p>
        </div>
      </div>

      {error && (
        <p role="alert" className="dashq-profile-message is-error">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="dashq-profile-message is-success">
          {success}
        </p>
      )}

      {loading ? (
        <div className="dashq-content-panel dashq-profile-loading">
          Loading profile...
        </div>
      ) : profile ? (
        <section className="dashq-content-panel dashq-profile-card">
          <div className="dashq-profile-header">
            <div className="dashq-profile-avatar">
              {(form.name || user?.name || "E").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>{profile.name || user?.name || "Employee"}</h2>
              <p>{profile.email || user?.email}</p>
            </div>
          </div>

          {!editing ? (
            <>
              <div className="dashq-profile-grid">
                <div className="dashq-profile-field">
                  <span>Full name</span>
                  <strong>{profile.name || "—"}</strong>
                </div>
                <div className="dashq-profile-field">
                  <span>Email address</span>
                  <strong>{profile.email || "—"}</strong>
                </div>
                <div className="dashq-profile-field">
                  <span>Employee ID</span>
                  <strong>
                    {profile.employee_number ||
                      profile.employeeNumber ||
                      "Not available"}
                  </strong>
                </div>
                <div className="dashq-profile-field">
                  <span>Account status</span>
                  <strong>{profile.is_active ? "Active" : "Inactive"}</strong>
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
                className="dashq-profile-button is-primary"
              >
                Edit Profile
              </button>
            </>
          ) : (
            <form onSubmit={handleSave} className="dashq-profile-form">
              <div>
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>

              <div>
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="dashq-profile-actions">
                <button
                  type="submit"
                  disabled={saving}
                  className="dashq-profile-button is-primary"
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
                  className="dashq-profile-button is-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      ) : (
        <div className="dashq-content-panel dashq-profile-loading">
          Profile information could not be found.
        </div>
      )}
    </DashboardLayout>
  );
}
