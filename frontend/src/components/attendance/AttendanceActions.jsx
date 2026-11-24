import { useState } from "react";
import { clockIn, clockOut } from "../../services/attendanceService";

const formatTime = (value) =>
  new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

// `variant="inline"` renders just the buttons and messages, for placing
// inside another panel (the overview's "Your day").
export default function AttendanceActions({
  attendance,
  onAttendanceUpdated,
  variant = "panel",
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const hasClockedIn = Boolean(
  attendance?.login_time ?? attendance?.loginTime
);

const hasClockedOut = Boolean(
  attendance?.logout_time ?? attendance?.logoutTime
);

  const handleClockIn = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await clockIn();
      // The clock-in response carries no record; the refreshed attendance
      // shows the time the server saved.
      setMessage("You're clocked in.");
      await onAttendanceUpdated();
    } catch (err) {
      setError(err.message || "Unable to clock in.");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const data = await clockOut();
      const record = data?.attendance;
      setMessage(
        record?.logout_time
          ? `Clocked out at ${formatTime(record.logout_time)}, ${Number(
              record.working_hours ?? 0
            ).toFixed(2)} hrs today.`
          : "You're clocked out."
      );
      await onAttendanceUpdated();
    } catch (err) {
      setError(err.message || "Unable to clock out.");
    } finally {
      setLoading(false);
    }
  };

  const controls = (
    <>
      <div className={`flex flex-wrap gap-3 ${variant === "panel" ? "mt-6" : ""}`}>
        <button
          type="button"
          onClick={handleClockIn}
          disabled={loading || hasClockedIn}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && !hasClockedIn ? "Clocking in…" : "Clock In"}
        </button>

        <button
          type="button"
          onClick={handleClockOut}
          disabled={loading || !hasClockedIn || hasClockedOut}
          className="rounded-lg bg-slate-800 px-6 py-3 font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && hasClockedIn ? "Clocking out…" : "Clock Out"}
        </button>
      </div>

      {message && (
        <p role="status" className="mt-4 text-sm text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
    </>
  );

  if (variant === "inline") return controls;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">
        Mark Attendance
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Clock in when you start work and clock out when you finish.
      </p>

      {controls}
    </section>
  );
}
