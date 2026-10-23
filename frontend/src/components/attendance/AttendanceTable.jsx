export default function AttendanceTable({ records = [], loading = false }) {
  const formatTime = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-slate-900">
          Attendance History
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Review your previous attendance and daily earnings.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-162.5 text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Clock In</th>
              <th className="px-4 py-3 font-medium">Clock Out</th>
              <th className="px-4 py-3 font-medium">Hours</th>
              <th className="px-4 py-3 font-medium">Earnings</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-4 py-10 text-center text-slate-500">
                  Loading attendance records...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-10 text-center text-slate-400">
                  No attendance records found.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-4 text-slate-700">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {formatTime(record.login_time ?? record.loginTime)}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {formatTime(record.logout_time ?? record.logoutTime) }
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {Number(record.working_hours ?? record.workingHours ?? 0).toFixed(2)} hrs
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-900">
                    ₹{Number(record.daily_pay ?? record.dailyPay ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
