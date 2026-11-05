import { useEffect, useState } from "react";
import managerService from "../../services/managerServices";

export default function ManagerTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    managerService
      .getMyTeam()
      .then((data) => {
        if (active) setTeam(data.team ?? []);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || "Failed to load your team.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="dashq-content-panel">
      <div className="dashq-panel-heading">
        <div>
          <h2>My Team</h2>
          <p>Direct reports and their department information.</p>
        </div>
        {!loading && !error && (
          <span className="dashq-account-role">
            {team.length} {team.length === 1 ? "employee" : "employees"}
          </span>
        )}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Employee ID</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Designation</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Loading your team...
                  </td>
                </tr>
              ) : team.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No direct reports are assigned to you yet.
                  </td>
                </tr>
              ) : (
                team.map((employee) => (
                  <tr
                    key={employee.employee_id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">
                        {employee.name || "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {employee.email || ""}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {employee.employee_number || employee.employee_id}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {employee.department_name || "Not assigned"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {employee.designation_title || "Not assigned"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {employee.employment_status || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
