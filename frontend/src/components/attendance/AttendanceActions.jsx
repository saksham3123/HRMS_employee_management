import { useState } from "react";
import { clockIn, clockOut } from "../../services/attendanceService";

export default function AttendanceActions({
  attendance,
  onAttendanceUpdated,
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const hasClockedIn = Boolean(attendance?.loginTime);
  const hasClockedOut = Boolean(attendance?.logoutTime);

  const handleClockIn = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await clockIn();
      setMessage("Clock-in successful!");
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
      await clockOut();
      setMessage("Clock-out successful!");
      await onAttendanceUpdated();
    } catch (err) {
      setError(err.message || "Unable to clock out.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">
        Mark Attendance
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Clock in when you start work and clock out when you finish.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={handleClockIn}
          disabled={loading || hasClockedIn}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing..." : "Clock In"}
        </button>

        <button
          onClick={handleClockOut}
          disabled={loading || !hasClockedIn || hasClockedOut}
          className="rounded-lg bg-slate-800 px-6 py-3 font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing..." : "Clock Out"}
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
    </section>
  );
}
