import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { apiRequest } from "../services/api";
import { confirmAction } from "../utils/confirmAction";
import Modal from "../components/common/Modal";

const toList = (data) =>
  Array.isArray(data) ? data : data.requests ?? data.leaveRequests ?? [];

const isPending = (request) => request.status?.toLowerCase() === "pending";

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const statusClass = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-green-50 text-green-700";
    case "rejected":
      return "bg-red-50 text-red-700";
    case "cancelled":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-amber-50 text-amber-700";
  }
};

// Leave for everyone in one page:
// - leave.manage (HR, admin) reviews every request in the organization;
// - leave.approve.team (managers) reviews requests from direct reports;
// - leave.apply (everyone but admins) applies and tracks their own requests.
// The backend enforces the same rules (controllers/leave.controller.js).
export default function LeaveManagement() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const canReviewAll = hasPermission("leave.manage");
  const canReviewTeam = !canReviewAll && hasPermission("leave.approve.team");
  const canReview = canReviewAll || canReviewTeam;
  const canApply = user?.role !== "admin" && hasPermission("leave.apply");

  const [reviewRequests, setReviewRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState({});
  const [reviewFilter, setReviewFilter] = useState("pending");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [leaveTypesError, setLeaveTypesError] = useState("");
  const [showApply, setShowApply] = useState(false);

  const [form, setForm] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const fetchReviewRequests = useCallback(async () => {
    if (!canReview) return [];
    return toList(await apiRequest(canReviewAll ? "/leave" : "/leave/team"));
  }, [canReview, canReviewAll]);

  const fetchMyRequests = useCallback(async () => {
    if (!canApply) return [];
    return toList(await apiRequest("/leave/mine"));
  }, [canApply]);

  const fetchLeaveTypes = useCallback(async () => {
    if (!canApply) return [];
    const data = await apiRequest("/leave/types");
    return Array.isArray(data)
      ? data
      : data.leaveTypes ?? data.types ?? [];
  }, [canApply]);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      fetchReviewRequests(),
      fetchMyRequests(),
      fetchLeaveTypes(),
    ]).then(([reviewResult, mineResult, typesResult]) => {
      if (!active) return;
      const errors = [];

      if (reviewResult.status === "fulfilled") {
        setReviewRequests(reviewResult.value);
      } else {
        errors.push(
          `Requests to review could not be loaded: ${reviewResult.reason.message}`
        );
      }

      if (mineResult.status === "fulfilled") {
        setMyRequests(mineResult.value);
      } else {
        errors.push(
          `Your requests could not be loaded: ${mineResult.reason.message}`
        );
      }

      if (typesResult.status === "fulfilled") {
        setLeaveTypes(typesResult.value);
      } else {
        setLeaveTypesError(
          typesResult.reason.message || "Failed to load leave types."
        );
      }

      setError(errors.join(" "));
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [fetchReviewRequests, fetchMyRequests, fetchLeaveTypes]);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.endDate < form.startDate) {
      setError("End date cannot be before the start date.");
      return;
    }

    setSubmitting(true);

    try {
      await apiRequest("/leave", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          leaveTypeId: Number(form.leaveTypeId),
        }),
      });

      setSuccess("Leave request submitted. It's now waiting for review.");
      setShowApply(false);
      setForm({
        leaveTypeId: "",
        startDate: "",
        endDate: "",
        reason: "",
      });

      try {
        setMyRequests(await fetchMyRequests());
      } catch (refreshError) {
        setError(
          `Your request was submitted, but the list could not be refreshed: ${
            refreshError.message || "Unknown error"
          }`
        );
      }
    } catch (err) {
      setError(err.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (request, status) => {
    if (
      status === "cancelled" &&
      !(await confirmAction(
        isPending(request)
          ? {
              title: `Cancel ${request.employee_name}'s request?`,
              text: `This ${request.leave_type} request will be closed without a decision. It can't be reopened.`,
              confirmText: "Cancel request",
              cancelText: "Keep it",
              tone: "danger",
            }
          : {
              title: `Cancel ${request.employee_name}'s approved leave?`,
              text: `They'll be expected at work on those dates. This can't be undone.`,
              confirmText: "Cancel leave",
              cancelText: "Keep it",
              tone: "danger",
            }
      ))
    ) {
      return;
    }

    setError("");
    setSuccess("");
    setReviewingId(request.id);

    try {
      const data = await apiRequest(`/leave/${request.id}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          reviewComment: reviewRemarks[request.id]?.trim() ?? "",
        }),
      });

      setSuccess(`${request.employee_name}: ${data?.message ?? `request ${status}.`}`);
      setReviewRemarks((previous) => ({
        ...previous,
        [request.id]: "",
      }));
      try {
        setReviewRequests(await fetchReviewRequests());
      } catch (refreshError) {
        setError(
          `Request updated, but the list could not be refreshed: ${
            refreshError.message || "Unknown error"
          }`
        );
      }
    } catch (err) {
      setError(err.message || "Failed to review leave request.");
    } finally {
      setReviewingId(null);
    }
  };

  // The backend refuses self-review, so don't offer it.
  const isOwnRequest = (request) =>
    Boolean(user?.email) && request.employee_email === user.email;

  // Requests still waiting on this reviewer's own decision.
  const pendingCount = reviewRequests.filter((request) => request.my_step).length;
  const shownReviewRequests =
    reviewFilter === "pending"
      ? reviewRequests.filter(isPending)
      : reviewRequests;

  return (
    <>
      {error && !showApply && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {canReview && (
          <section className="dashq-content-panel" aria-labelledby="review-heading">
            <div className="dashq-panel-heading">
              <div>
                <h2 id="review-heading">
                  {canReviewAll ? "Requests to review" : "Your team's requests"}
                </h2>
                <p>
                  {loading
                    ? "Loading…"
                    : pendingCount === 0
                      ? "Nothing is waiting for your decision."
                      : `${pendingCount} waiting for your decision.`}
                </p>
              </div>
              <div className="dashq-segmented" role="group" aria-label="Show requests">
                <button
                  type="button"
                  aria-pressed={reviewFilter === "pending"}
                  onClick={() => setReviewFilter("pending")}
                >
                  Pending
                </button>
                <button
                  type="button"
                  aria-pressed={reviewFilter === "all"}
                  onClick={() => setReviewFilter("all")}
                >
                  All
                </button>
              </div>
            </div>

            {loading ? (
              <p className="py-8 text-center text-slate-500">Loading requests…</p>
            ) : shownReviewRequests.length === 0 ? (
              <p className="py-8 text-center text-slate-500">
                {reviewFilter === "pending"
                  ? "No pending requests."
                  : canReviewAll
                    ? "No one in your organization has requested leave yet."
                    : "None of your direct reports have requested leave yet."}
              </p>
            ) : (
              <div className="space-y-4">
                {shownReviewRequests.map((request) => (
                  <LeaveRequestCard
                    key={request.id}
                    request={request}
                    showEmployee
                  >
                    {request.my_step && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <label
                            htmlFor={`review-remarks-${request.id}`}
                            className="mb-1 block text-sm font-medium text-slate-700"
                          >
                            Your note as {request.my_step === "hr" ? "HR" : "their manager"} (optional)
                          </label>
                          <textarea
                            id={`review-remarks-${request.id}`}
                            value={reviewRemarks[request.id] ?? ""}
                            onChange={(event) =>
                              setReviewRemarks((previous) => ({
                                ...previous,
                                [request.id]: event.target.value,
                              }))
                            }
                            maxLength={1000}
                            rows={2}
                            disabled={reviewingId === request.id}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={reviewingId === request.id}
                            onClick={() => handleReview(request, "approved")}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={reviewingId === request.id}
                            onClick={() => handleReview(request, "rejected")}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                    {canReviewAll && !isOwnRequest(request) && isPending(request) && (
                      <div className="mt-3">
                        <button
                          type="button"
                          disabled={reviewingId === request.id}
                          onClick={() => handleReview(request, "cancelled")}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                        >
                          Cancel request
                        </button>
                      </div>
                    )}
                    {canReviewAll && !isOwnRequest(request) &&
                      request.status?.toLowerCase() === "approved" && (
                      <div className="mt-3">
                        <button
                          type="button"
                          disabled={reviewingId === request.id}
                          onClick={() => handleReview(request, "cancelled")}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                        >
                          Cancel approved leave
                        </button>
                      </div>
                    )}
                    {isOwnRequest(request) && isPending(request) && (
                      <p className="mt-3 text-sm text-slate-500">
                        This is your own request, so someone else reviews it.
                      </p>
                    )}
                  </LeaveRequestCard>
                ))}
              </div>
            )}
          </section>
        )}

        <Modal
          open={showApply}
          title="Apply for leave"
          description="Your request goes to your manager or HR for a decision."
          onClose={() => setShowApply(false)}
          busy={submitting}
        >
          {error && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="leaveTypeId" className="mb-1 block text-sm font-medium">
                Leave type
              </label>
              <select
                id="leaveTypeId"
                name="leaveTypeId"
                value={form.leaveTypeId}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-3"
              >
                <option value="">Select leave type</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {!loading && leaveTypes.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  {leaveTypesError || "Your organization hasn't set up any leave types yet."}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="startDate" className="mb-1 block text-sm font-medium">
                Start date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-3"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="mb-1 block text-sm font-medium">
                End date
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                min={form.startDate || undefined}
                value={form.endDate}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-3"
              />
            </div>

            <div>
              <label htmlFor="reason" className="mb-1 block text-sm font-medium">
                Reason
              </label>
              <textarea
                id="reason"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                required
                rows={3}
                maxLength={1000}
                placeholder="Explain why you need leave"
                className="w-full rounded-lg border border-slate-300 px-3 py-3"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApply(false)}
                disabled={submitting}
                className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || leaveTypes.length === 0 || Boolean(leaveTypesError)}
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit request"}
              </button>
            </div>
          </form>
        </Modal>

        {canApply && (
        <section className="dashq-content-panel" aria-labelledby="mine-heading">
          <div className="dashq-panel-heading">
            <div>
              <h2 id="mine-heading">Your requests</h2>
              <p>Dates, status and any note from the person who reviewed it.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setShowApply(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Apply for leave
            </button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-500">Loading requests…</p>
          ) : myRequests.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              You haven't requested any leave yet.
            </p>
          ) : (
            <div className="space-y-4">
              {myRequests.map((request) => (
                <LeaveRequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </section>
        )}
      </div>
    </>
  );
}

function LeaveRequestCard({ request, showEmployee = false, children }) {
  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">
            {showEmployee
              ? request.employee_name ?? `Employee #${request.employee_id ?? "—"}`
              : request.leave_type ?? "Leave"}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {showEmployee && `${request.leave_type ?? "Leave"} · `}
            {formatDate(request.start_date ?? request.startDate)}
            {" – "}
            {formatDate(request.end_date ?? request.endDate)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(request.status)}`}>
          {request.status}
        </span>
      </div>

      <p className="mt-2 break-words text-sm text-slate-600">
        {request.reason}
      </p>

      <ApprovalSteps request={request} />

      {request.status === "cancelled" && (request.review_comment || request.reviewed_by_name) && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {request.review_comment && (
            <p className="break-words">
              <span className="font-medium">Cancellation note:</span>{" "}
              {request.review_comment}
            </p>
          )}
          {request.reviewed_by_name && (
            <p className="mt-1 text-xs text-slate-600">
              Cancelled by {request.reviewed_by_name}
              {request.reviewed_at &&
                ` on ${new Date(request.reviewed_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}`}
            </p>
          )}
        </div>
      )}

      {children}
    </article>
  );
}

const formatShortDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

// The two decisions behind a request: HR and the reporting manager.
function ApprovalSteps({ request }) {
  // Requests from before two-step approval have no step fields.
  if (!request.hr_status) return null;

  const closed = request.status === "rejected" || request.status === "cancelled";
  const steps = [
    { label: "HR", status: request.hr_status, by: request.hr_reviewed_by_name, at: request.hr_reviewed_at, note: request.hr_comment },
    { label: "Manager", status: request.manager_status, by: request.manager_reviewed_by_name, at: request.manager_reviewed_at, note: request.manager_comment },
  ];

  const describe = (step) => {
    if (step.status === "not_required") return step.label === "Manager" ? "Not needed (no reporting manager)" : "Not needed";
    if (step.status === "pending") return closed ? "Not needed" : "Waiting";
    const verb = step.status === "approved" ? "Approved" : "Rejected";
    return `${verb}${step.by ? ` by ${step.by}` : ""}${step.at ? `, ${formatShortDate(step.at)}` : ""}`;
  };

  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="Approvals">
      {steps.map((step) => (
        <li key={step.label} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <span className="font-semibold text-slate-900">{step.label}:</span>{" "}
          <span
            className={
              step.status === "approved"
                ? "text-green-700"
                : step.status === "rejected"
                  ? "text-red-700"
                  : "text-slate-600"
            }
          >
            {describe(step)}
          </span>
          {step.note && (
            <p className="mt-1 break-words text-slate-600">"{step.note}"</p>
          )}
        </li>
      ))}
    </ul>
  );
}
