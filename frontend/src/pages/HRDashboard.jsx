
import { useAuth } from "../context/AuthContext";

export default function HRDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-800">
          HR Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Welcome, {user?.name || "HR"}!
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Employees
            </p>
            <p className="mt-2 text-2xl font-bold">—</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Pending Leave Requests
            </p>
            <p className="mt-2 text-2xl font-bold">—</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Departments
            </p>
            <p className="mt-2 text-2xl font-bold">—</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Attendance Overview
            </p>
            <p className="mt-2 text-2xl font-bold">—</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">
            HR Management
          </h2>

          <p className="mt-2 text-gray-600">
            Manage employees, departments, leave requests, and
            attendance from one place.
          </p>
        </div>
      </div>
    </div>
  );
}
