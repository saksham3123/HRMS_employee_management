import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import PlatformLayout from "../../components/platform/PlatformLayout";
import PlatformOverview from "../../components/platform/PlatformOverview";
import OrganizationsTable from "../../components/platform/OrganizationsTable";
import OrganizationDetails from "../../components/platform/OrganizationDetails";
import CreateOrganizationForm from "../../components/platform/CreateOrganizationForm";
import PlansManager from "../../components/platform/PlansManager";
import Modal from "../../components/common/Modal";
import {
  createOrganization,
  getOverview,
  getPlatformAdmin,
  listOrganizations,
  listPlans,
} from "../../services/platformService";

export default function PlatformDashboard() {
  const admin = getPlatformAdmin();

  // The section lives in the URL (/platform/companies) so refresh and Back work.
  const { section = "overview" } = useParams();
  const activeItem = section;
  const [overview, setOverview] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  // Bumped after every change so the details panel reloads too.
  const [refreshKey, setRefreshKey] = useState(0);
  const detailsRef = useRef(null);

  // Reload the numbers and the company list together.
  const loadData = useCallback(async () => {
    try {
      const [overviewData, organizationList, planList] = await Promise.all([
        getOverview(),
        listOrganizations(),
        listPlans(),
      ]);
      setOverview(overviewData);
      setPlans(planList);
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

  // Messages belong to the page they were shown on: clear them when the
  // section changes (adjusting state during render, not in an effect).
  const [messageSection, setMessageSection] = useState(section);
  if (messageSection !== section) {
    setMessageSection(section);
    setError("");
    setSuccess("");
  }

  // The details panel opens above the table; bring it into view, since the
  // row that opened it may be far down the page.
  useEffect(() => {
    if (selectedId) {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      detailsRef.current?.focus({ preventScroll: true });
    }
  }, [selectedId]);

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

  if (!["overview", "companies", "plans"].includes(section)) {
    return <Navigate to="/platform" replace />;
  }

  return (
    <PlatformLayout activeItem={activeItem}>
      {activeItem === "overview" && (
        <PlatformOverview
          admin={admin}
          overview={overview}
          organizations={organizations}
          loading={loading}
          error={error}

        />
      )}

      {activeItem === "companies" && (
        <>
          <div className="dashq-page-heading">
            <div>
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

          {error && !showCreateForm && (
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
            open={showCreateForm}
            title="New company"
            description="Creates the company, its first admin and default leave types."
            onClose={() => setShowCreateForm(false)}
            busy={saving}
            size="lg"
          >
            {error && (
              <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <CreateOrganizationForm
              plans={plans.filter((plan) => plan.is_active)}
              onSubmit={handleCreate}
              onCancel={() => setShowCreateForm(false)}
              saving={saving}
            />
          </Modal>

          {selectedId && (
            <div ref={detailsRef} tabIndex={-1} className="mb-6 outline-none">
            <OrganizationDetails
              organizationId={selectedId}
              refreshKey={refreshKey}
              onClose={() => setSelectedId(null)}
            />
            </div>
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
                plans={plans.filter((plan) => plan.is_active)}
                onChanged={handleTableChanged}
                onView={setSelectedId}
                onError={setError}
              />
            )}
          </section>
        </>
      )}
      {activeItem === "plans" && (
        <PlansManager plans={plans} loading={loading} onChanged={loadData} />
      )}
    </PlatformLayout>
  );
}
