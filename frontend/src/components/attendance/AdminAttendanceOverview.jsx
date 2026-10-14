
const formatTime = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value ?? 0);

export default function AdminAttendanceOverview({
  records = [],
  loading = false,
  error = "",
}) {
  const currentlyWorking = records.filter(
    (record) => record.loginTime && !record.logoutTime
  );

  const clockedOut = records.filter(
    (record) => record.loginTime && record.logoutTime
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading today's attendance...
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {error && (
  <p
    role="alert"
    className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
  >
    {error}
  </p>
)}
      {/* Attendance summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Currently Working
          </p>

          <p className="mt-3 text-3xl font-bold text-blue-700">
            {currentlyWorking.length}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Clocked in, not yet clocked out
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Clocked Out Today
          </p>

          <p className="mt-3 text-3xl font-bold text-emerald-700">
            {clockedOut.length}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Attendance completed for today
          </p>
        </div>
      </div>

      {/* Attendance records */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h3 className="text-lg font-bold text-slate-900">
            Today's Attendance
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Employee clock-in, clock-out, hours, and earnings
          </p>
        </div>

        {records.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            No attendance records found for today.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Employee</th>
                  <th className="px-5 py-4 font-medium">Clock In</th>
                  <th className="px-5 py-4 font-medium">Clock Out</th>
                  <th className="px-5 py-4 font-medium">Hours</th>
                  <th className="px-5 py-4 font-medium">Daily Pay</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {records.map((record) => {
                  const isWorking =
                    Boolean(record.loginTime) && !record.logoutTime;

                  return (
                    <tr key={record._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {record.userId?.name || "Unknown employee"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {record.userId?.email || "—"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {formatTime(record.loginTime)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {formatTime(record.logoutTime)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {Number(record.workingHours ?? 0).toFixed(2)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {formatMoney(record.dailyPay)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            isWorking
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {isWorking ? "Working" : "Clocked Out"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
