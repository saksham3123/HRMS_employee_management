
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { apiRequest } from "../services/api";

export default function LeaveManagement() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const canViewAll =
    ["hr", "admin"].includes(user?.role) && hasPermission("leave.manage");
  const canReview = user?.role === "hr" && hasPermission("leave.manage");
  const canApply =
    user?.role !== "admin" && hasPermission("leave.apply");

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [leaveTypesError, setLeaveTypesError] = useState("");

  const [form, setForm] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const fetchLeaveRequests = useCallback(async () => {
    const endpoint = canViewAll ? "/leave" : "/leave/mine";
    const data = await apiRequest(endpoint);
    return Array.isArray(data)
      ? data
      : data.requests ?? data.leaveRequests ?? [];
  }, [canViewAll]);

  const fetchLeaveTypes = useCallback(async () => {
    const data = await apiRequest("/leave/types");
    return Array.isArray(data)
      ? data
      : data.leaveTypes ?? data.types ?? [];
  }, []);

  useEffect(() => {
    let active = true;

    Promise.allSettled([fetchLeaveRequests(), fetchLeaveTypes()]).then(
      ([requestsResult, typesResult]) => {
        if (!active) return;

        if (requestsResult.status === "fulfilled") {
          setLeaveRequests(requestsResult.value);
        } else {
          setError(
            requestsResult.reason.message || "Failed to load leave requests."
          );
        }

        if (typesResult.status === "fulfilled") {
          setLeaveTypes(typesResult.value);
        } else {
          setLeaveTypesError(
            typesResult.reason.message || "Failed to load leave types."
          );
        }

        setLoading(false);
      }
    );

    return () => {
      active = false;
    };
  }, [fetchLeaveRequests, fetchLeaveTypes]);

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

      setSuccess("Leave request submitted successfully.");
      setForm({
        leaveTypeId: "",
        startDate: "",
        endDate: "",
        reason: "",
      });

      try {
        const requests = await fetchLeaveRequests();
        setLeaveRequests(requests);
      } catch (refreshError) {
        setError(
          `Leave request submitted, but requests could not be refreshed: ${
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

  const handleReview = async (requestId, status) => {
    setError("");
    setSuccess("");
    setReviewingId(requestId);

    try {
      await apiRequest(`/leave/${requestId}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          reviewComment: reviewRemarks[requestId]?.trim() ?? "",
        }),
      });

      setSuccess(`Leave request ${status.toLowerCase()} successfully.`);
      setReviewRemarks((previous) => ({
        ...previous,
        [requestId]: "",
      }));
      try {
        const requests = await fetchLeaveRequests();
        setLeaveRequests(requests);
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

  return (
    <>
      <div className="dashq-page-heading">
        <div>
          <div className="dashq-eyebrow">WORKSPACE / LEAVE</div>
          <p>Submit leave requests and track their status.</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {canApply && (
        <section className="dashq-content-panel">
          <div className="dashq-panel-heading">
            <div>
              <h2>Apply for Leave</h2>
              <p>Enter the dates and reason for your leave.</p>
            </div>
          </div>

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
              {leaveTypes.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  {leaveTypesError || "No leave types are currently available."}
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

            <button
              type="submit"
              disabled={submitting || leaveTypes.length === 0 || Boolean(leaveTypesError)}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </section>
        )}

        <section className={`dashq-content-panel ${canApply ? "" : "xl:col-span-2"}`}>
          <div className="dashq-panel-heading">
            <div>
              <h2>{canViewAll ? "All Leave Requests" : "My Leave Requests"}</h2>
              <p>Review request dates and current status.</p>
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-500">Loading requests...</p>
          ) : leaveRequests.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No leave requests found.</p>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {request.leave_type ?? request.leave_type_name ?? request.leaveTypeName ?? "Leave"}
                      </h3>
                      {canViewAll && (
                        <p className="mt-1 text-sm text-slate-500">
                          {request.employee_name ?? request.employeeName ?? `Employee #${request.employee_id ?? request.employeeId ?? "—"}`}
                        </p>
                      )}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(request.status)}`}>
                      {request.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {formatDate(request.start_date ?? request.startDate)}
                    {" – "}
                    {formatDate(request.end_date ?? request.endDate)}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {request.reason}
                  </p>

                  {(request.review_comment || request.reviewed_by_name) && (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                      {request.review_comment && (
                        <p>
                          <span className="font-medium">HR note:</span>{" "}
                          {request.review_comment}
                        </p>
                      )}
                      {request.reviewed_by_name && (
                        <p className="mt-1 text-xs text-slate-500">
                          Reviewed by {request.reviewed_by_name}
                        </p>
                      )}
                    </div>
                  )}

                  {canReview &&
                    ["pending", "approved"].includes(
                      request.status?.toLowerCase()
                    ) && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label
                          htmlFor={`review-remarks-${request.id}`}
                          className="mb-1 block text-sm font-medium text-slate-700"
                        >
                          HR remarks
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
                          placeholder="Add remarks for this decision (optional)"
                          disabled={reviewingId === request.id}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {request.status?.toLowerCase() === "pending" && (
                          <>
                            <button
                              type="button"
                              disabled={reviewingId === request.id}
                              onClick={() => handleReview(request.id, "approved")}
                              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={reviewingId === request.id}
                              onClick={() => handleReview(request.id, "rejected")}
                              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              Deny
                            </button>
                            <button
                              type="button"
                              disabled={reviewingId === request.id}
                              onClick={() => handleReview(request.id, "cancelled")}
                              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                            >
                              Cancel Request
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {canReview &&
                    request.status?.toLowerCase() === "approved" && (
                    <div className="mt-3">
                      <button
                        type="button"
                        disabled={reviewingId === request.id}
                        onClick={() => handleReview(request.id, "cancelled")}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                      >
                        Cancel Approved Leave
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
