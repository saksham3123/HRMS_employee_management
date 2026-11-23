import { useCallback, useEffect, useState } from "react";
import PlatformLayout from "../../components/platform/PlatformLayout";
import PlatformOverview from "../../components/platform/PlatformOverview";
import OrganizationsTable from "../../components/platform/OrganizationsTable";
import OrganizationDetails from "../../components/platform/OrganizationDetails";
import CreateOrganizationForm from "../../components/platform/CreateOrganizationForm";
import {
  createOrganization,
  getOverview,
  getPlatformAdmin,
  listOrganizations,
} from "../../services/platformService";

export default function PlatformDashboard() {
  const admin = getPlatformAdmin();

  const [activeItem, setActiveItem] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  // Bumped after every change so the details panel reloads too.
  const [refreshKey, setRefreshKey] = useState(0);

  // Reload the numbers and the company list together.
  const loadData = useCallback(async () => {
    try {
      const [overviewData, organizationList] = await Promise.all([
        getOverview(),
        listOrganizations(),
      ]);
      setOverview(overviewData);
      setOrganizations(organizationList);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err.message || "Failed to load platform data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNavigate = (key) => {
    setActiveItem(key);
    setError("");
    setSuccess("");
  };

  const handleCreate = async (payload) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await createOrganization(payload);
      setSuccess(
        `${result.organization.name} created. Its admin (${result.admin.email}) can now log in at /login.`
      );
      setShowCreateForm(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to create company.");
    } finally {
      setSaving(false);
    }
  };

  const handleTableChanged = useCallback(async () => {
    setError("");
    setSuccess("Changes saved.");
    await loadData();
  }, [loadData]);

  return (
    <PlatformLayout activeItem={activeItem} onNavigate={handleNavigate}>
      {activeItem === "overview" && (
        <PlatformOverview
          admin={admin}
          overview={overview}
          organizations={organizations}
          loading={loading}
          error={error}
          onOpenCompanies={() => handleNavigate("companies")}
        />
      )}

      {activeItem === "companies" && (
        <>
          <div className="dashq-page-heading">
            <div>
              <div className="dashq-eyebrow">PLATFORM / COMPANIES</div>
              <h1>Companies</h1>
              <p>Create companies, change plans and suspend or reactivate accounts.</p>
            </div>
            {!showCreateForm && (
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(true);
                  setError("");
                  setSuccess("");
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <i className="bi bi-plus-lg" /> New company
              </button>
            )}
          </div>

          {error && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </p>
          )}

          {showCreateForm && (
            <section className="dashq-content-panel">
              <div className="dashq-panel-heading">
                <div>
                  <h2>New company</h2>
                  <p>Creates the company, its first admin and default leave types.</p>
                </div>
              </div>
              <CreateOrganizationForm
                onSubmit={handleCreate}
                onCancel={() => setShowCreateForm(false)}
                saving={saving}
              />
            </section>
          )}

          {selectedId && (
            <OrganizationDetails
              organizationId={selectedId}
              refreshKey={refreshKey}
              onClose={() => setSelectedId(null)}
            />
          )}

          <section className="dashq-content-panel">
            <div className="dashq-panel-heading">
              <div>
                <h2>All companies</h2>
                <p>{organizations.length} on the platform</p>
              </div>
            </div>

            {loading ? (
              <p className="py-10 text-center text-slate-500">Loading companies...</p>
            ) : (
              <OrganizationsTable
                organizations={organizations}
                onChanged={handleTableChanged}
                onView={setSelectedId}
                onError={setError}
              />
            )}
          </section>
        </>
      )}
    </PlatformLayout>
  );
}
