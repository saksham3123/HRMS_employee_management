
import { useAuth } from "../context/AuthContext";

export default function ManagerDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-800">
          Manager Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Welcome, {user?.name || "Manager"}!
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              My Team
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
              Team Attendance Today
            </p>
            <p className="mt-2 text-2xl font-bold">—</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">
            Team Management
          </h2>

          <p className="mt-2 text-gray-600">
            View your team's attendance, monitor leave requests,
            and track team members.
          </p>
        </div>
      </div>
    </div>
  );
}
