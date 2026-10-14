import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

import Sidebar from "../components/common/Sidebar";
import TodaySummary from "../components/attendance/TodaySummary";
import AttendanceActions from "../components/attendance/AttendanceActions";
import AttendanceTable from "../components/attendance/AttendanceTable";

import {
  getTodayAttendance,
  getAttendanceHistory,
} from "../services/attendanceService";

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const [attendance, setAttendance] = useState(null);
  const [records, setRecords] = useState([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");

  const fetchAttendance = useCallback(async () => {
    try {
      setError("");

      const data = await getTodayAttendance();
      setAttendance(data.attendance ?? null);
    } catch (err) {
      setError(err.message || "Failed to load today's attendance.");
    } finally {
      setLoadingToday(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await getAttendanceHistory();
      setRecords(data.attendance ?? data.records ?? []);
    } catch (err) {
      setError(err.message || "Failed to load attendance history.");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
    fetchHistory();
  }, [fetchAttendance, fetchHistory]);

  const refreshAttendance = async () => {
    await Promise.all([fetchAttendance(), fetchHistory()]);
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Shared navigation sidebar */}
      <Sidebar />

      {/* Employee dashboard content */}
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Employee Portal
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Welcome back, {user?.name || "Employee"}!
            </h1>

            <p className="mt-2 text-slate-500">
              Manage your attendance and track your working hours.
            </p>
          </header>

          {error && (
            <p
              role="alert"
              className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {loadingToday ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
              Loading today's attendance...
            </div>
          ) : (
            <>
              <TodaySummary attendance={attendance} />

              <div className="mt-8">
                <AttendanceActions
                  attendance={attendance}
                  onAttendanceUpdated={refreshAttendance}
                />
              </div>
            </>
          )}

          <div className="mt-8">
            <AttendanceTable
              records={records}
              loading={loadingHistory}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
