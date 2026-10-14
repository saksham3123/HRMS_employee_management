
import { useState } from "react";
import { getMonthlyPayrollByEmployee } from "../../services/adminService";

export default function MonthlyPayrollTable() {
  const now = new Date();

  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  const formatMoney = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value ?? 0);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setHasGenerated(false);

    try {
      const data = await getMonthlyPayrollByEmployee(month, year);
      setPayroll(data.payroll ?? []);
      setHasGenerated(true);
    } catch (err) {
      setError(err.message || "Failed to load monthly payroll.");
    } finally {
      setLoading(false);
    }
  };

  const totalPayroll = payroll.reduce(
    (total, employee) => total + Number(employee.totalEarnings ?? 0),
    0
  );

  const totalHours = payroll.reduce(
    (total, employee) => total + Number(employee.totalWorkingHours ?? 0),
    0
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Monthly Payroll by Employee
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Review each employee's earnings and working hours for a selected month.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div>
          <label
            htmlFor="payroll-month"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Month
          </label>
          <select
            id="payroll-month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
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
            htmlFor="payroll-year"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Year
          </label>
          <input
            id="payroll-year"
            type="number"
            min="2000"
            max="2100"
            required
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-3"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Generate Payroll"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {hasGenerated && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total Payroll</p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatMoney(totalPayroll)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total Working Hours</p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {totalHours.toFixed(2)} hrs
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">  Total Employees</p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {payroll.length}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Attendance Days</th>
                  <th className="px-4 py-3 font-medium">Working Hours</th>
                  <th className="px-4 py-3 font-medium">Monthly Earnings</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {payroll.map((employee) => (
                  <tr key={employee.userId}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {employee.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {employee.email}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {employee.attendanceDays}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {Number(employee.totalWorkingHours ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatMoney(employee.totalEarnings)}
                    </td>
                  </tr>
                ))}

                {payroll.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                     No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
