import { useState } from "react";
import { getMonthlyReport } from "../../services/adminService";

export default function MonthlyReport({ employees = [] }) {
  const now = new Date();

  const [userId, setUserId] = useState("");

  
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setError("Please select an employee.");
      return;
    }
    
    setLoading(true);
    setError("");
    setReport(null);
    
    try {
      const data = await getMonthlyReport(userId, month, year);
      setReport(data.report ?? data);
    } catch (err) {
      setError(err.message || "Failed to load monthly report.");
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value) =>
    `₹${Number(value ?? 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">
        Attendance & Payroll
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Generate a monthly report for an employee.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <label
            htmlFor="report-employee"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Employee
          </label>
          {/* <p>userid = {userId}</p> */}
          <select
            id="report-employee"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3"
          >
            <option value="">Select employee</option>
            {employees
              .filter((employee) => employee.roles?.includes("employee"))
              .map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} 
                </option>
              ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="report-month"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Month
          </label>
          <select
            id="report-month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3"
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={String(index + 1)}>
                {new Date(2000, index).toLocaleString("en-IN", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="report-year"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Year
          </label>
          <input
            id="report-year"
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-3"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={
  loading ||
  employees.filter((employee) => employee.roles?.includes("employee")).length === 0
}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {report && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Working Hours</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {Number(report.totalWorkingHours ?? 0).toFixed(2)} hrs
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Total Earnings</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatMoney(report.totalPay ?? report.totalEarnings)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Attendance Days</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {report.attendanceDays ?? report.totalDays ?? 0}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
